import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { useAuth } from '@/context/AuthContext';
import * as firestore from '@/lib/firestore';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/lib/firestore', () => ({
  subscribeToProjects: vi.fn()
}));

vi.mock('@/components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('@/components/DashboardStats', () => ({
  default: () => <div data-testid="dashboard-stats">Stats</div>
}));

vi.mock('@/components/ActivityFeed', () => ({
  default: () => <div data-testid="activity-feed">Activity</div>
}));

vi.mock('@/components/PersonalisedTodos', () => ({
  default: () => <div data-testid="personalised-todos">Todos</div>
}));

// Mock LoginPage to avoid rendering the real one when not logged in
vi.mock('./login/page', () => ({
  default: () => <div data-testid="login-page">Login Page Mock</div>
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    useAuth.mockReturnValue({ loading: true });
    const { container } = render(<HomePage />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders login page if not authenticated', () => {
    useAuth.mockReturnValue({ loading: false, user: null });
    render(<HomePage />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders dashboard empty state when no projects', () => {
    useAuth.mockReturnValue({ loading: false, user: { uid: 'u1', displayName: 'John Doe' } });
    firestore.subscribeToProjects.mockImplementation((uid, cb) => {
      cb([]);
      return vi.fn();
    });

    render(<HomePage />);
    expect(screen.getByText('Welcome back, John 👋')).toBeInTheDocument();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });

  it('renders dashboard with stats and activity when projects exist', () => {
    useAuth.mockReturnValue({ loading: false, user: { uid: 'u1', displayName: 'John Doe' } });
    firestore.subscribeToProjects.mockImplementation((uid, cb) => {
      cb([{ id: 'p1', name: 'Proj 1' }]);
      return vi.fn();
    });

    render(<HomePage />);
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
  });
});
