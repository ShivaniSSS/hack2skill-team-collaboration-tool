'use client';
import { useState, useEffect } from 'react';
import { subscribeToTasks } from '@/lib/firestore';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, ListTodo, Loader } from 'lucide-react';

export default function DashboardStats({ projectId }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeToTasks(projectId, setTasks);
    return unsub;
  }, [projectId]);

  const total = tasks.length;
  const todo = tasks.filter((t) => t.columnId === 'todo').length;
  const inProgress = tasks.filter((t) => t.columnId === 'in-progress').length;
  const inReview = tasks.filter((t) => t.columnId === 'in-review').length;
  const done = tasks.filter((t) => t.columnId === 'done').length;
  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.columnId === 'done') return false;
    const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
    return d.getTime() < Date.now();
  }).length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const cards = [
    { label: 'Total Tasks', value: total, icon: ListTodo, color: 'var(--accent-primary)', bg: 'var(--accent-primary-muted)' },
    { label: 'In Progress', value: inProgress, icon: Loader, color: 'var(--accent-secondary)', bg: 'hsla(175, 80%, 45%, 0.12)' },
    { label: 'Completed', value: done, icon: CheckCircle2, color: 'var(--accent-success)', bg: 'var(--accent-success-muted)' },
    { label: 'Overdue', value: overdue, icon: AlertTriangle, color: 'var(--accent-danger)', bg: 'var(--accent-danger-muted)' },
    { label: 'Completion', value: `${completionRate}%`, icon: TrendingUp, color: 'var(--accent-warning)', bg: 'var(--accent-warning-muted)' },
  ];

  return (
    <div className="stats-grid" role="region" aria-label="Project statistics">
      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-4);
        }
        .stat-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          transition: all var(--transition-base);
        }
        .stat-card:hover {
          border-color: var(--border-default);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .stat-icon {
          width: 44px; height: 44px;
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-value {
          font-size: var(--text-2xl);
          font-weight: 800;
          line-height: 1;
        }
        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          margin-top: var(--space-1);
        }
      `}</style>

      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="stat-card">
          <div className="stat-icon" style={{ background: bg }}>
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
