import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardStats from './DashboardStats';
import AnalyticsDashboard from './AnalyticsDashboard';
import * as firestore from '@/lib/firestore';

vi.mock('@/lib/firestore', () => ({
  subscribeToTasks: vi.fn()
}));

// Mock Chart.js completely to avoid canvas rendering issues in JSDOM
let mockDestroy = vi.fn();
vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: mockDestroy
  }))
}));

describe('DashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct stats based on tasks', () => {
    firestore.subscribeToTasks.mockImplementation((pid, cb) => {
      cb([
        { id: '1', columnId: 'todo', priority: 'high', dueDate: new Date(Date.now() + 100000) },
        { id: '2', columnId: 'in-progress' },
        { id: '3', columnId: 'done' },
        { id: '4', columnId: 'done' },
        { id: '5', columnId: 'in-review', dueDate: { toDate: () => new Date(Date.now() - 100000) } }, // overdue
      ]);
      return vi.fn();
    });

    render(<DashboardStats projectId="p1" />);
    
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    // 5 total tasks
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // 1 in progress
    const inProgVal = screen.getByText('In Progress').previousSibling.textContent;
    expect(inProgVal).toBe('1');
    
    // 2 completed
    const doneVal = screen.getByText('Completed').previousSibling.textContent;
    expect(doneVal).toBe('2');
    
    // 1 overdue
    const overdueVal = screen.getByText('Overdue').previousSibling.textContent;
    expect(overdueVal).toBe('1');
    
    // Completion rate = 2/5 = 40%
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('handles empty tasks array without NaN', () => {
    firestore.subscribeToTasks.mockImplementation((pid, cb) => { cb([]); return vi.fn(); });
    render(<DashboardStats projectId="p1" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('does nothing without projectId', () => {
    render(<DashboardStats />);
    expect(firestore.subscribeToTasks).not.toHaveBeenCalled();
  });
});

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDestroy.mockClear();
  });

  it('renders empty state if no tasks', () => {
    firestore.subscribeToTasks.mockImplementation((pid, cb) => { cb([]); return vi.fn(); });
    render(<AnalyticsDashboard projectId="p1" project={{ name: 'Alpha' }} />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
  });

  it('renders charts if tasks exist', () => {
    firestore.subscribeToTasks.mockImplementation((pid, cb) => {
      cb([
        { id: '1', columnId: 'todo', priority: 'critical' },
        { id: '2', columnId: 'in-progress', priority: 'high' },
        { id: '3', columnId: 'in-review', priority: 'medium' },
        { id: '4', columnId: 'done', priority: 'low' }
      ]);
      return vi.fn();
    });

    render(<AnalyticsDashboard projectId="p1" />);
    expect(screen.getByText('📊 Tasks by Status')).toBeInTheDocument();
    expect(screen.getByText('📈 Tasks by Priority')).toBeInTheDocument();
  });

  it('does nothing without projectId', () => {
    render(<AnalyticsDashboard />);
    expect(firestore.subscribeToTasks).not.toHaveBeenCalled();
  });

  it('cleans up chart instances on unmount', () => {
    firestore.subscribeToTasks.mockImplementation((pid, cb) => {
      cb([{ id: '1', columnId: 'todo', priority: 'critical' }]);
      return vi.fn();
    });

    const { unmount } = render(<AnalyticsDashboard projectId="p1" />);
    unmount();
    
    // Each chart (2 charts) is destroyed on unmount
    expect(mockDestroy).toHaveBeenCalledTimes(2);
  });
});
