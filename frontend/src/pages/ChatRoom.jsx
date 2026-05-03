import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mic, MicOff, Video, VideoOff, PhoneOff, Send, Smile, Paperclip, FastForward } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import './ChatRoom.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidateBuffer = useRef([]);

  const isOmegleMode = roomId.startsWith('random-');
  const noMicRooms = ['gaming', 'study'];
  const enforceNoMic = noMicRooms.includes(roomId);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  // Fetch messages if it's a permanent room
  useEffect(() => {
    if (!isOmegleMode) {
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

    // Multiple STUN servers for better NAT traversal
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.services.mozilla.com' }
      ]
    };

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Force disable mic in specific rooms
        if (enforceNoMic) {
          stream.getAudioTracks().forEach(track => {
            track.enabled = false;
          });
          setIsAudioMuted(true);
        }

        socket.emit('join-room', roomId);
      } catch (err) {
        console.error('Error accessing media devices', err);
        alert('Could not access camera/microphone. Please check browser permissions.');
        socket.emit('join-room', roomId); // join even without cam
      }
    };

    initializeMedia();

    const handleTrackEvent = (event) => {
      console.log('Received remote track', event);
      if (remoteVideoRef.current) {
        if (event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        } else {
          let stream = remoteVideoRef.current.srcObject;
          if (!stream) {
            stream = new MediaStream();
            remoteVideoRef.current.srcObject = stream;
          }
          stream.addTrack(event.track);
        }
        
        // Force play to overcome browser autoplay blocks
        remoteVideoRef.current.play().catch(e => console.warn('Autoplay prevented:', e));
      }
    };

    const flushIceCandidateBuffer = async (pc) => {
      while (iceCandidateBuffer.current.length > 0) {
        const candidate = iceCandidateBuffer.current.shift();
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding buffered ICE candidate', e);
        }
      }
    };

    // 1. Another user joined, initiate connection
    socket.on('user-joined', async (peerId) => {
      console.log('User joined, initiating WebRTC connection', peerId);
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      peerConnection.ontrack = handleTrackEvent;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', { target: peerId, candidate: event.candidate });
        }
      };

      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc-offer', { target: peerId, sdp: offer });
      } catch (e) {
        console.error('Error creating offer', e);
      }
    });

    // 2. Received offer, create answer
    socket.on('webrtc-offer', async (data) => {
      console.log('Received offer');
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      peerConnection.ontrack = handleTrackEvent;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', { target: data.callerId, candidate: event.candidate });
        }
      };

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushIceCandidateBuffer(peerConnection);
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('webrtc-answer', { target: data.callerId, sdp: answer });
      } catch (e) {
        console.error('Error handling offer and creating answer', e);
      }
    });

    // 3. Received answer
    socket.on('webrtc-answer', async (data) => {
      console.log('Received answer');
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await flushIceCandidateBuffer(peerConnectionRef.current);
        } catch (e) {
          console.error('Error setting remote description from answer', e);
        }
      }
    });

    // 4. Received ICE candidate
    socket.on('webrtc-ice-candidate', async (data) => {
      const candidate = new RTCIceCandidate(data.candidate);
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        // Buffer the candidate if peerConnection or remoteDescription is not ready
        iceCandidateBuffer.current.push(candidate);
      }
    });

    socket.on('receive-message', (newMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages if somehow received twice
        if (prev.some(msg => msg._id === newMessage._id || (msg.time === newMessage.time && msg.text === newMessage.text))) {
          return prev;
        }
        return [...prev, newMessage];
      });
      scrollToBottom();
    });

    socket.on('user-left', () => {
      console.log('User left the room');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    return () => {
      socket.emit('leave-room', roomId);
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('receive-message');
      socket.off('user-left');
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
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
    if (enforceNoMic) return; // Prevent unmuting
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
    navigate('/dashboard');
  };

  return (
    <div className="chatroom-container">
      <header className="chatroom-header flex-between glass-panel">
        <div className="flex-center" style={{ gap: '1rem' }}>
          <button className="icon-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="heading-md">
              {isOmegleMode ? 'Omegle Random Match' : `Room: ${roomId}`}
            </h2>
            {enforceNoMic && <p className="text-small" style={{ color: '#ef4444' }}>Microphone is forcibly disabled in this room.</p>}
          </div>
        </div>
        
        {isOmegleMode && (
          <button className="btn btn-secondary" onClick={handleNextPerson}>
            <FastForward size={16} /> Next Person
          </button>
        )}
      </header>

      <div className="chatroom-body">
        {/* Video Area */}
        <div className="video-area">
          <div className="video-grid">
            {/* Remote Video */}
            <div className="video-tile remote-video-container">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="fullscreen-video"
              ></video>
              <div className="participant-label">Partner</div>
            </div>

            {/* Local Video (Picture in Picture style) */}
            <div className="video-tile local-video-pip">
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
