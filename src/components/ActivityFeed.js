'use client';
import { useState, useEffect } from 'react';
import { subscribeToActivity } from '@/lib/firestore';
import { timeAgo } from '@/utils/helpers';
import { Activity, ArrowRight, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

const ACTION_ICONS = {
  created: Plus,
  updated: Edit2,
  deleted: Trash2,
  moved: ArrowRight,
  completed: CheckCircle,
};

const ACTION_COLORS = {
  created: 'var(--accent-success)',
  updated: 'var(--accent-primary)',
  deleted: 'var(--accent-danger)',
  moved: 'var(--accent-warning)',
  completed: 'var(--accent-success)',
};

export default function ActivityFeed({ projectId }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeToActivity(projectId, setActivities);
    return unsub;
  }, [projectId]);

  if (activities.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
        <Activity size={32} />
        <p style={{ marginTop: 'var(--space-2)' }}>No activity yet. Actions will appear here.</p>
      </div>
    );
  }

  return (
    <div role="feed" aria-label="Activity feed">
      <style jsx>{`
        .activity-list { display: flex; flex-direction: column; }
        .activity-item {
          display: flex; align-items: flex-start; gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-left: 2px solid var(--border-subtle);
          margin-left: 10px;
          transition: background var(--transition-fast);
          animation: slideInUp var(--transition-fast) ease-out;
        }
        .activity-item:hover { background: var(--bg-surface); border-radius: 0 var(--radius-md) var(--radius-md) 0; }
        .activity-icon {
          width: 24px; height: 24px; border-radius: var(--radius-full);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-left: -13px;
          background: var(--bg-primary); border: 2px solid var(--border-subtle);
        }
        .activity-content { flex: 1; min-width: 0; }
        .activity-text { font-size: var(--text-sm); line-height: 1.4; }
        .activity-actor { font-weight: 600; color: var(--text-primary); }
        .activity-action { color: var(--text-secondary); }
        .activity-target { font-weight: 600; color: var(--accent-primary); }
        .activity-time { font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 2px; }
      `}</style>

      <div className="activity-list">
        {activities.map((a) => {
          const Icon = ACTION_ICONS[a.action] || Activity;
          const color = ACTION_COLORS[a.action] || 'var(--text-secondary)';
          return (
            <article key={a.id} className="activity-item" role="article">
              <div className="activity-icon" style={{ borderColor: color }}>
                <Icon size={12} style={{ color }} />
              </div>
              <div className="activity-content">
                <div className="activity-text">
                  <span className="activity-actor">{a.actorName || 'Someone'}</span>{' '}
                  <span className="activity-action">{a.action}</span>{' '}
                  <span className="activity-target">{a.target}</span>
                  {a.details && <span className="activity-action"> {a.details}</span>}
                </div>
                <div className="activity-time">{timeAgo(a.createdAt)}</div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
