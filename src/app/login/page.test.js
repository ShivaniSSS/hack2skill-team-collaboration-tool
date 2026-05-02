import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { signInWithGoogle } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  signInWithGoogle: vi.fn()
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login page with branding', () => {
    render(<LoginPage />);
    expect(screen.getByText('TeamSync')).toBeInTheDocument();
    expect(screen.getByText(/Collaborate./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('handles sign in success', async () => {
    signInWithGoogle.mockResolvedValueOnce({});
    render(<LoginPage />);
    
    const btn = screen.getByRole('button', { name: 'Sign in with Google' });
    fireEvent.click(btn);
    
    expect(btn).toBeDisabled();
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    
    await waitFor(() => {
      expect(btn).not.toBeDisabled(); // Re-enables after finally block
    });
  });

  it('handles sign in failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    signInWithGoogle.mockRejectedValueOnce(new Error('fail'));
    
    render(<LoginPage />);
    
    const btn = screen.getByRole('button', { name: 'Sign in with Google' });
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(screen.getByText('Sign-in failed. Please try again.')).toBeInTheDocument();
    });
    
    consoleError.mockRestore();
  });
});
