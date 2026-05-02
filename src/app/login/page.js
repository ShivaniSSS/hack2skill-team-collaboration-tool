'use client';
import { signInWithGoogle } from '@/lib/auth';
import { useState } from 'react';
import { Zap, Users, BarChart3, MessageSquare, CheckSquare, Calendar } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: CheckSquare, title: 'Kanban Boards', desc: 'Drag-and-drop task management' },
    { icon: MessageSquare, title: 'Team Chat', desc: 'Real-time project messaging' },
    { icon: Calendar, title: 'Meeting Notes', desc: 'Scrum todo tracking per person' },
    { icon: BarChart3, title: 'Analytics', desc: 'Insights & team workload' },
    { icon: Users, title: 'Collaboration', desc: 'Real-time multi-user sync' },
    { icon: Zap, title: 'AI Powered', desc: 'Smart summaries & suggestions' },
  ];

  return (
    <div className="login-page">
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
        }
        .login-page::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -20%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, hsla(250, 90%, 65%, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .login-page::after {
          content: '';
          position: absolute;
          bottom: -30%;
          right: -10%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, hsla(175, 80%, 45%, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: var(--space-16);
          position: relative;
          z-index: 1;
        }
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-12);
        }
        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: var(--text-xl);
        }
        .brand h1 {
          font-size: var(--text-2xl);
          font-weight: 800;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .login-heading {
          font-size: var(--text-4xl);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: var(--space-4);
        }
        .login-sub {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          max-width: 480px;
          line-height: 1.6;
          margin-bottom: var(--space-8);
        }
        .google-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-6);
          background: white;
          color: #333;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-family);
          font-size: var(--text-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-md);
        }
        .google-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .google-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .google-logo {
          width: 20px;
          height: 20px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
          max-width: 440px;
        }
        .feature-card {
          padding: var(--space-5);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          transition: all var(--transition-base);
        }
        .feature-card:hover {
          border-color: var(--border-default);
          transform: translateY(-2px);
        }
        .feature-card h4 {
          font-size: var(--text-sm);
          font-weight: 600;
          margin-top: var(--space-2);
          margin-bottom: var(--space-1);
        }
        .feature-card p {
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }
        .error-msg {
          color: var(--accent-danger);
          font-size: var(--text-sm);
          margin-top: var(--space-3);
        }
        @media (max-width: 900px) {
          .login-right { display: none; }
          .login-left { padding: var(--space-8); }
        }
      `}</style>

      <div className="login-left">
        <div className="brand">
          <div className="brand-icon">T</div>
          <h1>TeamSync</h1>
        </div>
        <h2 className="login-heading">
          Collaborate.<br />Coordinate.<br />Ship faster.
        </h2>
        <p className="login-sub">
          The all-in-one platform for teams to manage tasks, track meetings,
          communicate in real-time, and gain insights — powered by Google Cloud.
        </p>
        <button
          className="google-btn"
          onClick={handleLogin}
          disabled={loading}
          id="google-sign-in-btn"
          aria-label="Sign in with Google"
        >
          {loading ? (
            <div className="spinner" style={{ width: 20, height: 20 }} />
          ) : (
            <svg className="google-logo" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <p className="error-msg" role="alert">{error}</p>}
      </div>

      <div className="login-right">
        <div className="features-grid" aria-label="Platform features">
          {features.map(({ icon: Icon, title, desc }) => (
            <div className="feature-card" key={title}>
              <Icon size={20} style={{ color: 'var(--accent-primary)' }} />
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
