import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from './ChatPanel';
import ActivityFeed from './ActivityFeed';
import * as firestore from '@/lib/firestore';

vi.mock('@/lib/firestore', () => ({
  subscribeToMessages: vi.fn(),
  sendMessage: vi.fn(),
  subscribeToActivity: vi.fn()
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ChatPanel', () => {
  const user = { uid: 'u1', displayName: 'John', photoURL: 'img.png' };

  beforeEach(() => {
    vi.clearAllMocks();
    firestore.subscribeToMessages.mockImplementation((pid, cb) => {
      cb([
        { id: '1', text: 'Hello', sender: 'u2', senderName: 'Jane' },
        { id: '2', text: 'Hi', sender: 'u1', senderName: 'John', senderPhoto: 'img.png' }
      ]);
      return vi.fn();
    });
  });

  it('renders messages and identifies own messages', () => {
    render(<ChatPanel projectId="p1" user={user} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    
    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.queryByText('John')).not.toBeInTheDocument();
  });

  it('renders empty state when no messages', () => {
    firestore.subscribeToMessages.mockImplementation((pid, cb) => { cb([]); return vi.fn(); });
    render(<ChatPanel projectId="p1" user={user} />);
    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
  });

  it('sends a new message', async () => {
    const usr = userEvent.setup({ delay: null });
    render(<ChatPanel projectId="p1" user={user} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    await usr.type(input, 'New msg');
    
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    
    await waitFor(() => {
      expect(firestore.sendMessage).toHaveBeenCalledWith('p1', {
        text: 'New msg',
        sender: 'u1',
        senderName: 'John',
        senderPhoto: 'img.png',
        type: 'text'
      });
      expect(input).toHaveValue(''); // clears on send
    });
  });

  it('prevents sending empty message', () => {
    render(<ChatPanel projectId="p1" user={user} />);
    const btn = screen.getByRole('button', { name: 'Send message' });
    
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(firestore.sendMessage).not.toHaveBeenCalled();
  });

  it('handles send failure gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    firestore.sendMessage.mockRejectedValueOnce(new Error('fail'));
    
    const usr = userEvent.setup({ delay: null });
    render(<ChatPanel projectId="p1" user={user} />);
    
    await usr.type(screen.getByPlaceholderText('Type a message...'), 'Test');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    
    consoleError.mockRestore();
  });
});

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.subscribeToActivity.mockImplementation((pid, cb) => {
      cb([
        { id: '1', action: 'created', target: 'Task 1', actorName: 'John' },
        { id: '2', action: 'moved', target: 'Task 2', details: 'to Done', actorName: 'Jane' },
        { id: '3', action: 'unknown', target: 'Something' }
      ]);
      return vi.fn();
    });
  });

  it('renders activity list with correct actions and details', () => {
    render(<ActivityFeed projectId="p1" />);
    
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('created')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('moved')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('to Done')).toBeInTheDocument();
  });

  it('renders default actor if missing', () => {
    render(<ActivityFeed projectId="p1" />);
    expect(screen.getByText('Someone')).toBeInTheDocument();
  });

  it('renders empty state if no activity', () => {
    firestore.subscribeToActivity.mockImplementation((pid, cb) => { cb([]); return vi.fn(); });
    render(<ActivityFeed projectId="p1" />);
    
    expect(screen.getByText(/No activity yet/i)).toBeInTheDocument();
  });

  it('does nothing if no projectId', () => {
    render(<ActivityFeed />);
    expect(firestore.subscribeToActivity).not.toHaveBeenCalled();
  });
});
