import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, PhoneOff, User, Sparkles } from 'lucide-react';
import { SocketContext } from '../contexts/SocketContext';
import './DirectChatModal.css';

const DirectChatModal = () => {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingChat = (data) => {
      console.log('Incoming direct chat received:', data);
      setInvite(data);
    };

    socket.on('incoming-direct-chat', handleIncomingChat);

    return () => {
      socket.off('incoming-direct-chat', handleIncomingChat);
    };
  }, [socket]);

  if (!invite) return null;

  const handleAccept = () => {
    const targetRoomId = invite.roomId;
    const partnerUserId = invite.callerId;
    const partnerName = invite.callerName;
    setInvite(null);
    navigate(`/chat/${targetRoomId}`, {
      state: {
        partnerUserId,
        partnerName
      }
    });
  };

  const handleDecline = () => {
    setInvite(null);
  };

  return (
    <div className="direct-chat-overlay flex-center">
      <div className="glass-panel direct-chat-card text-center">
        <div className="direct-chat-pulse-ring">
          {invite.callerPicture ? (
            <img src={invite.callerPicture} alt={invite.callerName} className="direct-chat-avatar" />
          ) : (
            <div className="direct-chat-avatar-placeholder flex-center">
              {invite.callerName ? invite.callerName.charAt(0).toUpperCase() : <User size={36} />}
            </div>
          )}
        </div>

        <div className="direct-chat-tag">
          <Sparkles size={14} style={{ color: '#ea580c' }} /> Direct Video Chat
        </div>

        <h3 className="heading-md mt-2" style={{ margin: '0.5rem 0' }}>
          {invite.callerName || 'A friend'}
        </h3>
        <p className="text-small text-muted mb-4">
          is inviting you to a private 1-on-1 video & chat lounge.
        </p>

        <div className="direct-chat-actions flex-center" style={{ gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary text-danger" onClick={handleDecline} style={{ flex: 1 }}>
            <PhoneOff size={16} /> Decline
          </button>
          <button className="btn btn-primary" onClick={handleAccept} style={{ flex: 1.4, background: '#10b981', borderColor: '#10b981' }}>
            <Video size={16} /> Join Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectChatModal;
