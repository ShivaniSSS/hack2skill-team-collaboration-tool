import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonalisedTodos from './PersonalisedTodos';
import * as firestore from '@/lib/firestore';

vi.mock('@/lib/firestore', () => ({
  subscribeToMeetings: vi.fn(),
  subscribeToMeetingTodos: vi.fn(),
  updateMeetingTodo: vi.fn()
}));

vi.mock('@/utils/helpers', () => ({
  formatDate: vi.fn(() => 'Oct 1')
}));

describe('PersonalisedTodos', () => {
  const mockUser = { uid: 'u1', displayName: 'John Doe' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no meetings', () => {
    firestore.subscribeToMeetings.mockImplementation((pid, cb) => {
      cb([]);
      return vi.fn();
    });

    render(<PersonalisedTodos projectId="p1" user={mockUser} />);
    expect(screen.getByText('No meeting todos assigned to you.')).toBeInTheDocument();
  });

  it('renders empty state when no assigned todos in meetings', () => {
    firestore.subscribeToMeetings.mockImplementation((pid, cb) => {
      cb([{ id: 'm1', title: 'Standup', date: '2026-10-01' }]);
      return vi.fn();
    });

    firestore.subscribeToMeetingTodos.mockImplementation((mid, cb) => {
      cb([
        { id: 't2', text: 'Other Task', assigneeUid: 'u2', completed: false, assignee: 'Jane' }
      ]);
      return vi.fn();
    });

    render(<PersonalisedTodos projectId="p1" user={mockUser} />);
    expect(screen.getByText('No meeting todos assigned to you.')).toBeInTheDocument();
  });

  it('renders todos assigned to the user from multiple meetings', async () => {
    firestore.subscribeToMeetings.mockImplementation((pid, cb) => {
      cb([
        { id: 'm1', title: 'Standup', date: '2026-10-01' },
        { id: 'm2', title: 'Retro', date: '2026-10-02' }
      ]);
      return vi.fn();
    });

    firestore.subscribeToMeetingTodos.mockImplementation((mid, cb) => {
      if (mid === 'm1') {
        cb([
          { id: 't1', text: 'My Task 1', assigneeUid: 'u1', completed: false, assignee: 'John Doe' },
          { id: 't2', text: 'Other Task', assigneeUid: 'u2', completed: false, assignee: 'Jane' }
        ]);
      } else {
        cb([
          { id: 't3', text: 'My Task 2', assigneeUid: 'u1', completed: true, assignee: 'John Doe' }
        ]);
      }
      return vi.fn();
    });

    render(<PersonalisedTodos projectId="p1" user={mockUser} />);
    
    expect(screen.getByText('My Task 1')).toBeInTheDocument();
    expect(screen.getByText('My Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Other Task')).not.toBeInTheDocument();
  });

  it('toggles a todo', async () => {
    firestore.subscribeToMeetings.mockImplementation((pid, cb) => {
      cb([{ id: 'm1', title: 'Standup', date: '2026-10-01' }]);
      return vi.fn();
    });

    firestore.subscribeToMeetingTodos.mockImplementation((mid, cb) => {
      cb([
        { id: 't1', text: 'My Task', assigneeUid: 'u1', completed: false, assignee: 'John Doe' }
      ]);
      return vi.fn();
    });

    render(<PersonalisedTodos projectId="p1" user={mockUser} />);
    
    // There's only one button for the one rendered todo
    const toggleBtn = screen.getByRole('button');
    fireEvent.click(toggleBtn);
    
    await waitFor(() => {
      expect(firestore.updateMeetingTodo).toHaveBeenCalledWith('m1', 't1', { completed: true });
    });
  });
});
