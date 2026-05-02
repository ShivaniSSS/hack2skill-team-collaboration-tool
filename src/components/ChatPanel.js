'use client';
import { useState, useEffect, useRef } from 'react';
import { subscribeToMessages, sendMessage } from '@/lib/firestore';
import { timeAgo, getInitials } from '@/utils/helpers';
import { Send, MessageSquare } from 'lucide-react';

export default function ChatPanel({ projectId, user, fullPage }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToMessages(projectId, setMessages);
    return unsub;
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(projectId, {
        text: text.trim(),
        sender: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        type: 'text',
      });
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
    setSending(false);
  };

  return (
    <div className="chat-container" style={{ height: fullPage ? 'calc(100vh - 48px)' : '100%' }}>
      <style jsx>{`
        .chat-container {
          display: flex; flex-direction: column;
          background: var(--bg-secondary); border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle); overflow: hidden;
        }
        .chat-header {
          padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-subtle);
          display: flex; align-items: center; gap: var(--space-3);
        }
        .chat-header h2 { font-size: var(--text-md); font-weight: 700; }
        .chat-body {
          flex: 1; overflow-y: auto; padding: var(--space-4) var(--space-5);
          display: flex; flex-direction: column; gap: var(--space-3);
        }
        .msg {
          display: flex; gap: var(--space-3); max-width: 85%;
          animation: slideInUp var(--transition-fast) ease-out;
        }
        .msg.mine { margin-left: auto; flex-direction: row-reverse; }
        .msg-avatar {
          width: 28px; height: 28px; border-radius: var(--radius-full);
          flex-shrink: 0; object-fit: cover;
        }
        .msg-avatar-placeholder {
          width: 28px; height: 28px; border-radius: var(--radius-full);
          background: var(--accent-primary-muted); color: var(--accent-primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; flex-shrink: 0;
        }
        .msg-bubble {
          background: var(--bg-surface); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); padding: var(--space-2) var(--space-3);
        }
        .msg.mine .msg-bubble {
          background: var(--accent-primary-muted); border-color: transparent;
        }
        .msg-name { font-size: var(--text-xs); font-weight: 600; color: var(--accent-primary); margin-bottom: 2px; }
        .msg-text { font-size: var(--text-sm); line-height: 1.5; }
        .msg-time { font-size: 10px; color: var(--text-tertiary); margin-top: 2px; }
        .chat-input-bar {
          padding: var(--space-3) var(--space-5); border-top: 1px solid var(--border-subtle);
          display: flex; gap: var(--space-2);
        }
        .chat-input {
          flex: 1; padding: var(--space-2) var(--space-3);
          background: var(--bg-surface); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); color: var(--text-primary);
          font-family: var(--font-family); font-size: var(--text-sm);
          outline: none; transition: border-color var(--transition-fast);
        }
        .chat-input:focus { border-color: var(--accent-primary); }
        .chat-input::placeholder { color: var(--text-tertiary); }
      `}</style>

      <div className="chat-header">
        <MessageSquare size={20} style={{ color: 'var(--accent-primary)' }} />
        <h2>Team Chat</h2>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          {messages.length} messages
        </span>
      </div>

      <div className="chat-body" role="log" aria-label="Chat messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <MessageSquare size={32} />
            <p style={{ marginTop: 'var(--space-2)' }}>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender === user.uid;
          return (
            <div key={msg.id} className={`msg ${isMine ? 'mine' : ''}`}>
              {msg.senderPhoto ? (
                <img src={msg.senderPhoto} alt="" className="msg-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="msg-avatar-placeholder">{getInitials(msg.senderName)}</div>
              )}
              <div className="msg-bubble">
                {!isMine && <div className="msg-name">{msg.senderName}</div>}
                <div className="msg-text">{msg.text}</div>
                <div className="msg-time">{timeAgo(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          aria-label="Message input"
        />
        <button className="btn btn-primary btn-icon" type="submit" disabled={!text.trim() || sending} aria-label="Send message">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
