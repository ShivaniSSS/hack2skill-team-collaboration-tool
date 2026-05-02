import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { onAuthChange } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  onAuthChange: vi.fn()
}));

function TestComponent() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not Logged In</div>;
  return <div>Logged in as {user.name}</div>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children with loading state initially, then updates when auth changes', () => {
    let authCallback;
    onAuthChange.mockImplementation((cb) => {
      authCallback = cb;
      return vi.fn(); // mock unsubscribe
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    act(() => {
      authCallback({ name: 'John Doe' });
    });

    expect(screen.getByText('Logged in as John Doe')).toBeInTheDocument();

    act(() => {
      authCallback(null);
    });

    expect(screen.getByText('Not Logged In')).toBeInTheDocument();
  });

  it('unsubscribes on unmount', () => {
    const unsubMock = vi.fn();
    onAuthChange.mockReturnValue(unsubMock);

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    unmount();
    expect(unsubMock).toHaveBeenCalled();
  });
  
  it('returns context from useAuth', () => {
    let authCallback;
    onAuthChange.mockImplementation((cb) => {
      authCallback = cb;
      return vi.fn();
    });

    let contextValue;
    function ValueCatcher() {
      contextValue = useAuth();
      return null;
    }

    render(
      <AuthProvider>
        <ValueCatcher />
      </AuthProvider>
    );

    expect(contextValue.loading).toBe(true);
    expect(contextValue.user).toBe(null);
  });
});
