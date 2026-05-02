import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskModal from './TaskModal';
import * as firestore from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';

vi.mock('@/lib/firestore', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  logActivity: vi.fn()
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: vi.fn()
}));

// Mock PRIORITIES constant to avoid import issues
vi.mock('@/utils/constants', () => ({
  PRIORITIES: [
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }
  ]
}));

describe('TaskModal', () => {
  const mockAddToast = vi.fn();
  const mockOnClose = vi.fn();
  const mockUser = { uid: 'u1', displayName: 'John' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue({ addToast: mockAddToast });
  });

  it('renders create modal when no task provided', () => {
    render(<TaskModal projectId="p1" user={mockUser} onClose={mockOnClose} />);
    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders edit modal when task provided', () => {
    render(<TaskModal projectId="p1" user={mockUser} task={{ id: 't1', title: 'Edit Me' }} onClose={mockOnClose} />);
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument();
  });

  it('submits new task successfully', async () => {
    const user = userEvent.setup();
    render(<TaskModal projectId="p1" user={mockUser} onClose={mockOnClose} />);
    
    await user.type(screen.getByLabelText(/Title/i), 'New Title');
    await user.type(screen.getByLabelText(/Description/i), 'Desc');
    await user.type(screen.getByLabelText(/Tags/i), 'a, b');
    
    // Simulate setting due date and select changes
    fireEvent.change(screen.getByLabelText(/Due Date/i), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText(/Priority/i), { target: { value: 'high' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    
    await waitFor(() => {
      expect(firestore.createTask).toHaveBeenCalledWith('p1', expect.objectContaining({
        title: 'New Title',
        description: 'Desc',
        tags: ['a', 'b'],
        priority: 'high',
        createdBy: 'u1',
        assignee: 'u1',
        dueDate: expect.stringContaining('2026-10-01')
      }));
      expect(firestore.logActivity).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith('Task created', 'success');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles create failure', async () => {
    const user = userEvent.setup();
    firestore.createTask.mockRejectedValueOnce(new Error('fail'));
    render(<TaskModal projectId="p1" user={mockUser} onClose={mockOnClose} />);
    
    await user.type(screen.getByLabelText(/Title/i), 'New Title');
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to save task', 'error');
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('updates existing task successfully', async () => {
    const user = userEvent.setup();
    render(<TaskModal projectId="p1" user={mockUser} task={{ id: 't1', title: 'Old', dueDate: { seconds: 1700000000 } }} onClose={mockOnClose} />);
    
    const input = screen.getByLabelText(/Title/i);
    await user.clear(input);
    await user.type(input, 'Updated');
    
    fireEvent.submit(screen.getByRole('button', { name: 'Update' }));
    
    await waitFor(() => {
      expect(firestore.updateTask).toHaveBeenCalledWith('p1', 't1', expect.objectContaining({
        title: 'Updated'
      }));
      expect(mockAddToast).toHaveBeenCalledWith('Task updated', 'success');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('prevents default empty form submit', async () => {
    render(<TaskModal projectId="p1" user={mockUser} onClose={mockOnClose} />);
    
    fireEvent.submit(screen.getByRole('button', { name: 'Create' }));
    expect(firestore.createTask).not.toHaveBeenCalled();
  });

  it('deletes task successfully', async () => {
    render(<TaskModal projectId="p1" user={mockUser} task={{ id: 't1', title: 'Old' }} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    
    await waitFor(() => {
      expect(firestore.deleteTask).toHaveBeenCalledWith('p1', 't1');
      expect(mockAddToast).toHaveBeenCalledWith('Task deleted', 'info');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles delete failure', async () => {
    firestore.deleteTask.mockRejectedValueOnce(new Error('fail'));
    render(<TaskModal projectId="p1" user={mockUser} task={{ id: 't1', title: 'Old' }} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to delete task', 'error');
    });
  });

  it('prevents submit with empty title', async () => {
    const user = userEvent.setup();
    render(<TaskModal projectId="p1" user={mockUser} onClose={mockOnClose} />);
    const btn = screen.getByRole('button', { name: 'Create' });
    expect(btn).toBeDisabled();
    
    await user.type(screen.getByLabelText(/Title/i), '  ');
    expect(btn).toBeDisabled();
  });

  it('closes on overlay click', () => {
    render(<TaskModal projectId="p1" user={mockUser} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('does not close on modal content click', () => {
    render(<TaskModal projectId="p1" user={mockUser} onClose={mockOnClose} />);
    // Assume the form inside dialog prevents close
    fireEvent.click(screen.getByText('New Task'));
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
