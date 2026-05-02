import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MeetingNotes from './MeetingNotes';
import * as firestore from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';

vi.mock('@/lib/firestore', () => ({
  subscribeToMeetings: vi.fn(),
  createMeeting: vi.fn(),
  createMeetingTodo: vi.fn(),
  subscribeToMeetingTodos: vi.fn(),
  updateMeetingTodo: vi.fn(),
  deleteMeetingTodo: vi.fn()
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: vi.fn()
}));

// Mock window date
const fixedDate = new Date('2026-05-02T12:00:00Z');

describe('MeetingNotes', () => {
  const mockAddToast = vi.fn();
  const user = { uid: 'u1', displayName: 'John' };
  
  const mockMeetings = [
    { id: 'm1', title: 'Daily Standup', type: 'standup', date: '2026-05-01', notes: 'Notes block' },
    { id: 'm2', title: 'Retro', type: 'retro', createdAt: { toDate: () => fixedDate }, notes: '' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
    useToast.mockReturnValue({ addToast: mockAddToast });
    
    firestore.subscribeToMeetings.mockImplementation((pid, cb) => {
      cb(mockMeetings);
      return vi.fn();
    });
    
    firestore.subscribeToMeetingTodos.mockImplementation((mid, cb) => {
      if (mid === 'm1') {
        cb([{ id: 't1', text: 'Task 1', completed: false, assignee: 'John' }]);
      } else {
        cb([{ id: 't2', text: 'Task 2', completed: true, assignee: 'Jane' }]);
      }
      return vi.fn();
    });
  });

  it('renders meetings list and types correctly', () => {
    render(<MeetingNotes projectId="p1" user={user} />);
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    expect(screen.getByText('Daily Standup')).toBeInTheDocument();
    expect(screen.getByText('Retro')).toBeInTheDocument();
  });

  it('renders empty state when no meetings', () => {
    firestore.subscribeToMeetings.mockImplementation((pid, cb) => { cb([]); return vi.fn(); });
    render(<MeetingNotes projectId="p1" user={user} />);
    expect(screen.getByText('No meetings yet')).toBeInTheDocument();
  });

  it('opens and closes create meeting modal', async () => {
    render(<MeetingNotes projectId="p1" user={user} />);
    
    fireEvent.click(screen.getByRole('button', { name: /New Meeting/i }));
    expect(screen.getByText('New Meeting', { selector: 'h2' })).toBeInTheDocument();
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('New Meeting', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('submits new meeting successfully', async () => {
    const usr = userEvent.setup({ delay: null });
    render(<MeetingNotes projectId="p1" user={user} />);
    
    fireEvent.click(screen.getByRole('button', { name: /New Meeting/i }));
    await usr.type(screen.getByLabelText(/Title \*/i), 'Sprint Plan');
    await usr.type(screen.getByLabelText(/Notes/i), 'Planning details');
    fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: 'planning' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Meeting' }));
    
    await waitFor(() => {
      expect(firestore.createMeeting).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Sprint Plan',
        notes: 'Planning details',
        type: 'planning',
        projectId: 'p1',
        createdBy: 'u1'
      }));
      expect(mockAddToast).toHaveBeenCalledWith('Meeting created', 'success');
    });
  });

  it('prevents submit of meeting with empty title', async () => {
    render(<MeetingNotes projectId="p1" user={user} />);
    fireEvent.click(screen.getByRole('button', { name: /New Meeting/i }));
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Meeting' }));
    expect(firestore.createMeeting).not.toHaveBeenCalled();
  });

  it('expands meeting card and shows todos and closes another', () => {
    render(<MeetingNotes projectId="p1" user={user} />);
    
    // Click first header to expand
    fireEvent.click(screen.getByText('Daily Standup'));
    expect(screen.getByText('Notes block')).toBeInTheDocument();
    expect(screen.getByText('Action Items (0/1)')).toBeInTheDocument();
    
    // Click second header to expand (closes first)
    fireEvent.click(screen.getByText('Retro'));
    expect(screen.queryByText('Notes block')).not.toBeInTheDocument();
    expect(screen.getByText('Action Items (1/1)')).toBeInTheDocument(); // It has 1 completed task
  });

  it('adds a new todo item', async () => {
    const usr = userEvent.setup({ delay: null });
    render(<MeetingNotes projectId="p1" user={user} />);
    fireEvent.click(screen.getByText('Daily Standup'));
    
    await usr.type(screen.getByPlaceholderText('Add action item...'), 'New Action');
    await usr.type(screen.getByPlaceholderText('Assignee'), 'Jane');
    
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    
    await waitFor(() => {
      expect(firestore.createMeetingTodo).toHaveBeenCalledWith('m1', expect.objectContaining({
        text: 'New Action',
        assignee: 'Jane',
        assigneeUid: 'u1'
      }));
    });
  });

  it('adds a new todo item with default assignee if empty', async () => {
    const usr = userEvent.setup({ delay: null });
    render(<MeetingNotes projectId="p1" user={user} />);
    fireEvent.click(screen.getByText('Daily Standup'));
    
    await usr.type(screen.getByPlaceholderText('Add action item...'), 'New Action');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    
    await waitFor(() => {
      expect(firestore.createMeetingTodo).toHaveBeenCalledWith('m1', expect.objectContaining({
        text: 'New Action',
        assignee: 'John', // default from user.displayName
      }));
    });
  });

  it('toggles a todo item status', async () => {
    render(<MeetingNotes projectId="p1" user={user} />);
    fireEvent.click(screen.getByText('Daily Standup'));
    
    fireEvent.click(screen.getByLabelText('Mark complete'));
    
    await waitFor(() => {
      expect(firestore.updateMeetingTodo).toHaveBeenCalledWith('m1', 't1', { completed: true });
    });
  });

  it('deletes a todo item', async () => {
    render(<MeetingNotes projectId="p1" user={user} />);
    fireEvent.click(screen.getByText('Daily Standup'));
    
    fireEvent.click(screen.getByLabelText('Delete todo'));
    
    await waitFor(() => {
      expect(firestore.deleteMeetingTodo).toHaveBeenCalledWith('m1', 't1');
    });
  });

  it('handles todo add failure', async () => {
    const usr = userEvent.setup({ delay: null });
    firestore.createMeetingTodo.mockRejectedValueOnce(new Error('fail'));
    render(<MeetingNotes projectId="p1" user={user} />);
    fireEvent.click(screen.getByText('Daily Standup'));
    
    await usr.type(screen.getByPlaceholderText('Add action item...'), 'New Action');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to add todo', 'error');
    });
  });
});
