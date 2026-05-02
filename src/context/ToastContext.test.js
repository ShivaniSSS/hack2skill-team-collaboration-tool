import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

function TestComponent({ message, type, duration }) {
  const { addToast, removeToast, toasts } = useToast();
  return (
    <div>
      <button onClick={() => addToast(message || 'test', type || 'info', duration)}>Add</button>
      <div data-testid="count">{toasts.length}</div>
    </div>
  );
}

function ErrorComponent() {
  useToast();
  return null;
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children and empty toast container initially', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child</div>
      </ToastProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('status').children.length).toBe(0);
  });

  it('adds a toast and automatically removes it after duration', () => {
    render(
      <ToastProvider>
        <TestComponent duration={2000} />
      </ToastProvider>
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    
    act(() => {
      screen.getByText('Add').click();
    });
    
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByText('test')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });

  it('allows manual removal of toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    act(() => {
      screen.getByText('Add').click();
    });
    
    const dismissBtn = screen.getByLabelText('Dismiss notification');
    act(() => {
      dismissBtn.click();
    });
    
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });

  it('throws error if useToast is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ErrorComponent />)).toThrow('useToast must be within ToastProvider');
    consoleError.mockRestore();
  });
});
