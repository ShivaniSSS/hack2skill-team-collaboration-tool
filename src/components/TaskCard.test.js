import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from './TaskCard';
import * as helpers from '@/utils/helpers';

vi.mock('@/utils/helpers', () => ({
  formatDate: vi.fn(() => 'Oct 1'),
  isDueSoon: vi.fn(() => false),
  isOverdue: vi.fn(() => false)
}));

describe('TaskCard', () => {
  const defaultTask = {
    id: 't1',
    title: 'Test Task',
    priority: 'high',
    description: 'This is a long description that should be truncated when it exceeds eighty characters so we can see the ellipsis',
    dueDate: '2026-10-01',
    tags: ['frontend', 'bug', 'extra']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title and correct priority emoji', () => {
    render(<TaskCard task={defaultTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('🟠')).toBeInTheDocument();
  });

  it('renders default emoji if priority missing', () => {
    render(<TaskCard task={{ ...defaultTask, priority: null }} />);
    expect(screen.getByText('🔵')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    render(<TaskCard task={defaultTask} />);
    expect(screen.getByText(/This is a long description that should be truncated/)).toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
  });

  it('renders full description if under 80 chars', () => {
    render(<TaskCard task={{ ...defaultTask, description: 'Short' }} />);
    expect(screen.getByText('Short')).toBeInTheDocument();
  });

  it('renders up to 2 tags', () => {
    render(<TaskCard task={defaultTask} />);
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.queryByText('extra')).not.toBeInTheDocument();
  });

  it('renders due date and applies overdue classes', () => {
    helpers.isOverdue.mockReturnValue(true);
    const { container } = render(<TaskCard task={defaultTask} />);
    expect(screen.getByText('Oct 1')).toBeInTheDocument();
    // Verify it applies the correct CSS class for overdue
    expect(container.querySelector('.overdue')).toBeInTheDocument();
  });

  it('renders due date and applies soon classes', () => {
    helpers.isDueSoon.mockReturnValue(true);
    helpers.isOverdue.mockReturnValue(false);
    const { container } = render(<TaskCard task={defaultTask} />);
    expect(container.querySelector('.soon')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked or enter key pressed', () => {
    const onClick = vi.fn();
    render(<TaskCard task={defaultTask} onClick={onClick} />);
    const card = screen.getByRole('listitem');
    
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(2);

    // Should ignore other keys
    fireEvent.keyDown(card, { key: 'Escape' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('calls onDragStart and onDragEnd', () => {
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    render(<TaskCard task={defaultTask} onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    
    const card = screen.getByRole('listitem');
    fireEvent.dragStart(card);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    
    fireEvent.dragEnd(card);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit and stops propagation', () => {
    const onEdit = vi.fn();
    const onClick = vi.fn();
    render(<TaskCard task={defaultTask} onEdit={onEdit} onClick={onClick} />);
    
    const editBtn = screen.getByRole('button', { name: /Edit task/i });
    fireEvent.click(editBtn);
    
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies dragging opacity', () => {
    const { container } = render(<TaskCard task={defaultTask} isDragging={true} />);
    const card = container.firstChild;
    expect(card).toHaveStyle({ opacity: '0.5' });
  });
});
