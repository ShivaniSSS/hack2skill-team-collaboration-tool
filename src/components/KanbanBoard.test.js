import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from './KanbanBoard';
import * as firestore from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';

vi.mock('@/lib/firestore', () => ({
  subscribeToTasks: vi.fn(),
  updateTask: vi.fn(),
  logActivity: vi.fn()
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: vi.fn()
}));

vi.mock('./TaskModal', () => ({
  default: ({ task, onClose }) => <div data-testid="task-modal">{task ? 'Edit' : 'New'} <button onClick={onClose}>CloseModal</button></div>
}));

vi.mock('./TaskDetailPanel', () => ({
  default: ({ task, onClose, onEdit }) => (
    <div data-testid="detail-panel">
      {task.title}
      <button onClick={onClose}>CloseDetail</button>
      <button onClick={onEdit}>EditFromDetail</button>
    </div>
  )
}));

// Mock TaskCard so we can trigger drag events easily
vi.mock('./TaskCard', () => ({
  default: ({ task, onClick, onEdit, onDragStart, onDragEnd }) => (
    <div 
      data-testid={`task-${task.id}`}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {task.title} ({task.priority})
      <button onClick={(e) => { e.stopPropagation(); onEdit(); }}>Edit Card</button>
    </div>
  )
}));

describe('KanbanBoard', () => {
  const mockAddToast = vi.fn();
  const user = { uid: 'u1', displayName: 'John' };
  const mockTasks = [
    { id: 't1', title: 'Task 1', priority: 'high', columnId: 'todo' },
    { id: 't2', title: 'Task 2', priority: 'low', columnId: 'in-progress' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue({ addToast: mockAddToast });
    firestore.subscribeToTasks.mockImplementation((pid, cb) => {
      cb(mockTasks);
      return vi.fn(); // unsub
    });
  });

  it('renders columns and tasks', () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText(/Task 1/)).toBeInTheDocument();
    expect(screen.getByText(/Task 2/)).toBeInTheDocument();
  });

  it('filters tasks by search query', async () => {
    const usr = userEvent.setup();
    render(<KanbanBoard projectId="p1" user={user} />);
    
    await usr.type(screen.getByPlaceholderText(/Search/i), 'Task 1');
    expect(screen.getByText(/Task 1/)).toBeInTheDocument();
    expect(screen.queryByText(/Task 2/)).not.toBeInTheDocument();
  });

  it('filters tasks by priority', async () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    fireEvent.change(screen.getByLabelText(/Filter by priority/i), { target: { value: 'low' } });
    expect(screen.queryByText(/Task 1/)).not.toBeInTheDocument();
    expect(screen.getByText(/Task 2/)).toBeInTheDocument();
  });

  it('opens and closes task modal', () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Add Task/i }));
    expect(screen.getByTestId('task-modal')).toHaveTextContent('New');
    
    fireEvent.click(screen.getByText('CloseModal'));
    expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
  });

  it('opens modal pre-filled when add button in column header is clicked', () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    // The second button in the header is usually the + button. 
    // We can target aria-label "Add task to To Do"
    const addColBtn = screen.getByLabelText('Add task to To Do');
    fireEvent.click(addColBtn);
    expect(screen.getByTestId('task-modal')).toHaveTextContent('Edit'); // Since editTask receives { columnId: 'todo' }, it's truthy
  });

  it('opens detail panel on task click and closes it', () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    fireEvent.click(screen.getByTestId('task-t1'));
    expect(screen.getByTestId('detail-panel')).toHaveTextContent('Task 1');
    
    fireEvent.click(screen.getByText('CloseDetail'));
    expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
  });

  it('handles edit from task card directly', () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    fireEvent.click(screen.getAllByText('Edit Card')[0]);
    expect(screen.getByTestId('task-modal')).toHaveTextContent('Edit');
  });

  it('handles edit from detail panel', () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    fireEvent.click(screen.getByTestId('task-t1'));
    fireEvent.click(screen.getByText('EditFromDetail'));
    
    expect(screen.getByTestId('task-modal')).toHaveTextContent('Edit');
    expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
  });

  it('handles drag and drop to move columns', async () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    const taskEl = screen.getByTestId('task-t1');
    const doneCol = screen.getByLabelText(/Done column/i);
    
    const mockDataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => 't1'),
      effectAllowed: '',
      dropEffect: ''
    };
    
    fireEvent.dragStart(taskEl, { dataTransfer: mockDataTransfer });
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', 't1');
    
    fireEvent.dragOver(doneCol, { dataTransfer: mockDataTransfer });
    expect(doneCol).toHaveClass('drag-over');
    
    fireEvent.drop(doneCol, { dataTransfer: mockDataTransfer });
    
    await waitFor(() => {
      expect(firestore.updateTask).toHaveBeenCalledWith('p1', 't1', { columnId: 'done' });
      expect(firestore.logActivity).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('completed'), 'success');
    });
  });

  it('handles drag leave and end', () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    const taskEl = screen.getByTestId('task-t1');
    const doneCol = screen.getByLabelText(/Done column/i);
    
    fireEvent.dragStart(taskEl, { dataTransfer: { setData: vi.fn() } });
    fireEvent.dragOver(doneCol, { dataTransfer: { dropEffect: '' } });
    expect(doneCol).toHaveClass('drag-over');
    
    fireEvent.dragLeave(doneCol);
    expect(doneCol).not.toHaveClass('drag-over');
    
    fireEvent.dragEnd(taskEl);
  });

  it('does nothing if dropped in same column', async () => {
    render(<KanbanBoard projectId="p1" user={user} />);
    
    const todoCol = screen.getByLabelText(/To Do column/i);
    const mockDataTransfer = { getData: vi.fn(() => 't1') };
    
    fireEvent.drop(todoCol, { dataTransfer: mockDataTransfer });
    expect(firestore.updateTask).not.toHaveBeenCalled();
  });

  it('handles updateTask failure gracefully', async () => {
    firestore.updateTask.mockRejectedValueOnce(new Error('Network error'));
    render(<KanbanBoard projectId="p1" user={user} />);
    
    const doneCol = screen.getByLabelText(/Done column/i);
    const mockDataTransfer = { getData: vi.fn(() => 't1') };
    
    fireEvent.drop(doneCol, { dataTransfer: mockDataTransfer });
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to move task', 'error');
    });
  });
});
