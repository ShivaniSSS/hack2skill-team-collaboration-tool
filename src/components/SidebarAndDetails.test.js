import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import TaskDetailPanel from './TaskDetailPanel';
import * as auth from '@/lib/auth';
import * as firestore from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn()
}));

vi.mock('@/lib/firestore', () => ({
  createProject: vi.fn()
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: vi.fn()
}));

describe('Sidebar', () => {
  const mockAddToast = vi.fn();
  const mockUser = { uid: 'u1', displayName: 'John Doe', email: 'j@d.com', photoURL: 'img.png' };

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue({ addToast: mockAddToast });
  });

  it('renders navigation items', () => {
    render(<Sidebar projects={[]} user={mockUser} currentView="dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
  });

  it('renders user info', () => {
    render(<Sidebar projects={[]} user={mockUser} currentView="dashboard" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('j@d.com')).toBeInTheDocument();
  });

  it('renders placeholder avatar if photoURL missing', () => {
    render(<Sidebar projects={[]} user={{ ...mockUser, photoURL: null }} currentView="dashboard" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('switches views on click', () => {
    const onChangeView = vi.fn();
    render(<Sidebar projects={[]} user={mockUser} currentView="dashboard" onChangeView={onChangeView} />);
    
    fireEvent.click(screen.getByText('Kanban Board'));
    expect(onChangeView).toHaveBeenCalledWith('board');
  });

  it('renders project list and selects project', () => {
    const onSelectProject = vi.fn();
    const projects = [{ id: 'p1', name: 'Alpha', color: 'red' }];
    render(<Sidebar projects={projects} user={mockUser} onSelectProject={onSelectProject} />);
    
    const projBtn = screen.getByText('Alpha');
    expect(projBtn).toBeInTheDocument();
    fireEvent.click(projBtn);
    expect(onSelectProject).toHaveBeenCalledWith(projects[0]);
  });

  it('opens new project form and submits', async () => {
    const usr = userEvent.setup({ delay: null });
    render(<Sidebar projects={[]} user={mockUser} />);
    
    fireEvent.click(screen.getByLabelText('Create new project'));
    
    const input = screen.getByPlaceholderText('Project name...');
    await usr.type(input, 'Beta');
    
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    
    await waitFor(() => {
      expect(firestore.createProject).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Beta',
        owner: 'u1'
      }));
      expect(mockAddToast).toHaveBeenCalledWith('Project created!', 'success');
      expect(screen.queryByPlaceholderText('Project name...')).not.toBeInTheDocument();
    });
  });

  it('handles project creation failure', async () => {
    const usr = userEvent.setup({ delay: null });
    firestore.createProject.mockRejectedValueOnce(new Error('fail'));
    render(<Sidebar projects={[]} user={mockUser} />);
    
    fireEvent.click(screen.getByLabelText('Create new project'));
    await usr.type(screen.getByPlaceholderText('Project name...'), 'Beta');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to create project', 'error');
    });
  });

  it('prevents empty project creation', () => {
    render(<Sidebar projects={[]} user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Create new project'));
    fireEvent.submit(screen.getByRole('button', { name: 'Add' }));
    expect(firestore.createProject).not.toHaveBeenCalled();
  });

  it('calls sign out', () => {
    render(<Sidebar projects={[]} user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Sign out'));
    expect(auth.signOut).toHaveBeenCalled();
  });
});

describe('TaskDetailPanel', () => {
  const mockTask = {
    title: 'Test',
    description: 'Desc',
    priority: 'high',
    columnId: 'todo',
    dueDate: '2026-10-01',
    tags: ['bug'],
    createdAt: new Date(Date.now() - 10000)
  };

  it('renders task details', () => {
    render(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('🟠 High')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('renders default fallback values if missing', () => {
    render(<TaskDetailPanel task={{ title: 'Fallback', priority: 'unknown', columnId: 'unknown' }} />);
    expect(screen.getByText('unknown', { selector: '.badge-unknown' })).toBeInTheDocument();
  });

  it('calls onClose from overlay or button', () => {
    const onClose = vi.fn();
    const { container } = render(<TaskDetailPanel task={mockTask} onClose={onClose} />);
    
    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(onClose).toHaveBeenCalledTimes(1);
    
    fireEvent.click(container.querySelector('.slide-panel-overlay'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onEdit', () => {
    const onEdit = vi.fn();
    render(<TaskDetailPanel task={mockTask} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    expect(onEdit).toHaveBeenCalled();
  });
});
