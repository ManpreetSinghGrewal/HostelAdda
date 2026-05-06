import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mic, MicOff, Video, VideoOff, PhoneOff, Send, Smile, Paperclip, FastForward, UserPlus } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import './ChatRoom.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Waiting for others...');
  const [remoteStreams, setRemoteStreams] = useState([]); // [{ peerId, stream }]
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isSearchingNext, setIsSearchingNext] = useState(false);

  // Omegle specific partner ID & Name
  const partnerUserId = location.state?.partnerUserId || null;
  const [partnerName, setPartnerName] = useState(location.state?.partnerName || 'Partner');
  
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // Maps peerId -> RTCPeerConnection
  const peerConnectionsRef = useRef(new Map());
  // Maps peerId -> ICE Candidate Buffer
  const iceCandidateBuffers = useRef(new Map());

  const isOmegleMode = roomId.startsWith('random-');
  const noMicRooms = ['gaming', 'study'];
  const enforceNoMic = noMicRooms.includes(roomId);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    // Cleanup local stream on complete unmount (when navigating away from ChatRoom entirely)
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // Fetch messages if it's a permanent room, clear if random
  useEffect(() => {
    if (isOmegleMode) {
      setMessages([]); // Clear chat every time a new random room is joined
    } else {
      const fetchMessages = async () => {
        try {
          const { data } = await axios.get(`${API_URL}/api/rooms/${roomId}/messages`);
          setMessages(data);
          scrollToBottom();
        } catch (error) {
          console.error('Error fetching messages', error);
        }
      };
      fetchMessages();
    }
  }, [roomId, isOmegleMode]);

  // WebRTC & Socket setup
  useEffect(() => {
    if (!socket || !user) return;

    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    };

    const initializeMedia = async () => {
      try {
        if (!localStreamRef.current) {
          setConnectionStatus('Accessing camera...');
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        if (enforceNoMic && localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = false;
          });
          setIsAudioMuted(true);
        } else if (!enforceNoMic && localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
          setIsAudioMuted(false);
        }

        setConnectionStatus('Waiting for others...');
        socket.emit('join-room', { roomId, userId: user._id });
      } catch (err) {
        console.error('Error accessing media devices', err);
        setConnectionStatus('Camera access denied');
        alert('Could not access camera/microphone. Please check browser permissions.');
        socket.emit('join-room', { roomId, userId: user._id }); 
      }
    };

    initializeMedia();

    const handleTrackEvent = (event, peerId) => {
      console.log('Received remote track from', peerId);
      const incomingStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      
      setRemoteStreams(prev => {
        const exists = prev.find(p => p.peerId === peerId);
        if (exists) {
          // Update stream if needed, though usually same stream object
          return prev;
        }
        return [...prev, { peerId, stream: incomingStream }];
      });
      setConnectionStatus('Connected!');
    };

    const flushIceCandidateBuffer = async (pc, peerId) => {
      const buffer = iceCandidateBuffers.current.get(peerId) || [];
      while (buffer.length > 0) {
        const candidate = buffer.shift();
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding buffered ICE candidate', e);
        }
      }
    };

    const setupPeerConnectionEvents = (pc, peerIdTarget) => {
      pc.ontrack = (event) => handleTrackEvent(event, peerIdTarget);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', { target: peerIdTarget, candidate: event.candidate });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`ICE Connection State [${peerIdTarget}]:`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          // Remove remote stream on failure
          setRemoteStreams(prev => prev.filter(p => p.peerId !== peerIdTarget));
          pc.close();
          peerConnectionsRef.current.delete(peerIdTarget);
        }
      };
    };

    const createPeerConnection = (peerId) => {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionsRef.current.set(peerId, pc);
      if (!iceCandidateBuffers.current.has(peerId)) {
        iceCandidateBuffers.current.set(peerId, []);
      }

      setupPeerConnectionEvents(pc, peerId);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }
      return pc;
    };

    // 1. Another user joined, initiate connection
    socket.on('user-joined', async (data) => {
      const { socketId: peerId } = data;
      console.log('User joined, initiating WebRTC connection', peerId);
      setConnectionStatus('Peer joining...');
      
      const pc = createPeerConnection(peerId);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { target: peerId, sdp: offer });
      } catch (e) {
        console.error('Error creating offer', e);
      }
    });

    // 2. Received offer, create answer
    socket.on('webrtc-offer', async (data) => {
      const peerId = data.callerId;
      console.log('Received offer from', peerId);
      setConnectionStatus('Receiving connection...');
      
      const pc = createPeerConnection(peerId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushIceCandidateBuffer(pc, peerId);
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { target: peerId, sdp: answer });
      } catch (e) {
        console.error('Error handling offer and creating answer', e);
      }
    });

    // 3. Received answer
    socket.on('webrtc-answer', async (data) => {
      const peerId = data.answererId;
      console.log('Received answer from', peerId);
      const pc = peerConnectionsRef.current.get(peerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await flushIceCandidateBuffer(pc, peerId);
        } catch (e) {
          console.error('Error setting remote description from answer', e);
        }
      }
    });

    // 4. Received ICE candidate
    socket.on('webrtc-ice-candidate', async (data) => {
      const peerId = data.senderId;
      const candidate = new RTCIceCandidate(data.candidate);
      const pc = peerConnectionsRef.current.get(peerId);
      
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        if (!iceCandidateBuffers.current.has(peerId)) {
          iceCandidateBuffers.current.set(peerId, []);
        }
        iceCandidateBuffers.current.get(peerId).push(candidate);
      }
    });

    socket.on('receive-message', (newMessage) => {
      setMessages((prev) => {
        if (prev.some(msg => msg._id === newMessage._id || (msg.time === newMessage.time && msg.text === newMessage.text))) {
          return prev;
        }
        return [...prev, newMessage];
      });
      scrollToBottom();
    });

    socket.on('match-found', (data) => {
      setIsSearchingNext(false);
      setPartnerName(data.partnerName || 'Partner');
      navigate(`/chat/${data.roomId}`, { state: { partnerUserId: data.partnerUserId, partnerName: data.partnerName }, replace: true });
    });

    socket.on('user-left', (peerId) => {
      console.log('User left the room', peerId);
      
      setRemoteStreams(prev => {
        const remaining = prev.filter(p => p.peerId !== peerId);
        if (remaining.length === 0) setConnectionStatus('Waiting for others...');
        return remaining;
      });

      const pc = peerConnectionsRef.current.get(peerId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(peerId);
      }
      iceCandidateBuffers.current.delete(peerId);
    });

    return () => {
      socket.emit('leave-room', roomId);
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('receive-message');
      socket.off('user-left');
      socket.off('match-found');
      
      // Do NOT stop local stream here because we want to reuse it between random match rooms.
      // Full unmount cleanup handles it.
      
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      iceCandidateBuffers.current.clear();
    };
  }, [socket, roomId, user, enforceNoMic]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !user) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageData = {
      roomId,
      senderId: user._id,
      senderName: user.name,
      text: message,
      time
    };

    socket.emit('send-message', messageData);
    setMessage('');
    scrollToBottom();
  };

  const toggleAudio = () => {
    if (enforceNoMic) return;
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const handleNextPerson = () => {
    socket.emit('leave-room', roomId);
    setRemoteStreams([]);
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    iceCandidateBuffers.current.clear();
    setIsSearchingNext(true);
    setConnectionStatus('Searching for next person...');
    socket.emit('join-random', user.name);
  };

  const handleSendFriendRequest = async () => {
    if (!partnerUserId) return;
    try {
      await axios.post(`${API_URL}/api/users/friend-request`, {
        fromUserId: user._id,
        toUserId: partnerUserId
      });
      setFriendRequestSent(true);
      alert('Friend request sent!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending request');
    }
  };

  // Video Grid layout calculation
  // In Random match mode, local video is PiP, so it doesn't take up a grid slot!
  const totalVideos = isOmegleMode ? Math.max(1, isSearchingNext ? 1 : remoteStreams.length) : remoteStreams.length + 1; 
  let gridClass = 'grid-1';
  if (totalVideos === 2) gridClass = 'grid-2';
  else if (totalVideos >= 3 && totalVideos <= 4) gridClass = 'grid-4';
  else if (totalVideos >= 5 && totalVideos <= 6) gridClass = 'grid-6';
  else if (totalVideos >= 7) gridClass = 'grid-9';

  return (
    <div className="chatroom-container">
      <header className="chatroom-header flex-between glass-panel">
        <div className="flex-center" style={{ gap: '1rem' }}>
          <button className="icon-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="heading-md">
              {isOmegleMode ? 'Chitmeet Random Match' : `Room: ${roomId}`}
            </h2>
            <p className="text-small" style={{ color: connectionStatus === 'Connected!' ? '#10b981' : '#f59e0b' }}>
              {connectionStatus}
            </p>
            {enforceNoMic && <p className="text-small" style={{ color: '#ef4444' }}>Microphone is forcibly disabled in this room.</p>}
          </div>
        </div>
        
        {isOmegleMode && (
          <div className="flex-center" style={{ gap: '1rem' }}>
            {partnerUserId && (
              <button 
                className="btn btn-secondary" 
                onClick={handleSendFriendRequest}
                disabled={friendRequestSent}
                style={{ background: friendRequestSent ? '#10b981' : '', color: friendRequestSent ? 'white' : '' }}
              >
                <UserPlus size={16} /> {friendRequestSent ? 'Request Sent' : 'Add Friend'}
              </button>
            )}
            <button className="btn btn-primary" onClick={handleNextPerson}>
              <FastForward size={16} /> Next Person
            </button>
          </div>
        )}
      </header>

      <div className="chatroom-body">
        {/* Video Area */}
        <div className="video-area">
          <div className={`video-grid ${gridClass}`}>
            
            {/* Render all remote streams */}
            {isSearchingNext ? (
              <div className="video-tile loading-tile flex-center">
                <div className="loader"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Searching for partner...</p>
              </div>
            ) : remoteStreams.map((remote) => (
              <div key={remote.peerId} className="video-tile">
                <video 
                  autoPlay 
                  playsInline 
                  className="fullscreen-video"
                  ref={el => {
                    if (el && el.srcObject !== remote.stream) {
                      el.srcObject = remote.stream;
                      el.play().catch(e => console.warn('Play prevented:', e));
                    }
                  }}
                ></video>
                <div className="participant-label">{partnerName}</div>
              </div>
            ))}

            {/* Local Video */}
            <div className={`video-tile ${(remoteStreams.length > 0 || isSearchingNext) && isOmegleMode ? 'local-video-pip' : ''}`}>
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="fullscreen-video"
              ></video>
              <div className="participant-label">You</div>
            </div>
          </div>

          <div className="video-controls glass-panel flex-center">
            <button 
              className={`control-btn ${isAudioMuted ? 'muted' : ''} ${enforceNoMic ? 'disabled' : ''}`}
              onClick={toggleAudio}
              disabled={enforceNoMic}
              title={enforceNoMic ? "Mic disabled in this room" : "Toggle Mic"}
            >
              {isAudioMuted || enforceNoMic ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button 
              className={`control-btn ${isVideoMuted ? 'muted' : ''}`}
              onClick={toggleVideo}
            >
              {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
            <button className="control-btn end-call-btn" onClick={() => navigate('/dashboard')}>
              <PhoneOff size={20} color="white" />
            </button>
          </div>
        </div>

        {/* Text Chat Area */}
        <div className="chat-area glass-panel">
          <div className="chat-messages">
            {messages.map((msg, index) => {
              const isMine = user && msg.senderId === user._id;
              return (
                <div key={msg._id || index} className={`message-bubble-container ${isMine ? 'mine' : 'theirs'}`}>
                  {!isMine && <span className="message-sender">{msg.senderName}</span>}
                  <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    {msg.text}
                  </div>
                  <span className="message-time">{msg.time}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <button type="button" className="icon-btn text-muted"><Paperclip size={20} /></button>
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Type a message..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="button" className="icon-btn text-muted"><Smile size={20} /></button>
            <button type="submit" className="icon-btn send-btn"><Send size={18} color="white" /></button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
