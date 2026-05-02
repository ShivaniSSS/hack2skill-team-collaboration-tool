'use client';
import { formatDate, timeAgo, getInitials } from '@/utils/helpers';
import { X, Edit2, Calendar, Tag, User, Clock, Flag } from 'lucide-react';

export default function TaskDetailPanel({ task, projectId, user, onClose, onEdit }) {
  const priorityMap = { critical: '🔴 Critical', high: '🟠 High', medium: '🟡 Medium', low: '🔵 Low' };
  const statusMap = { 'todo': 'To Do', 'in-progress': 'In Progress', 'in-review': 'In Review', 'done': 'Done' };

  return (
    <>
      <div className="slide-panel-overlay" onClick={onClose} />
      <div className="slide-panel" role="dialog" aria-label="Task details">
        <style jsx>{`
          .panel-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border-subtle);
          }
          .panel-body { padding: var(--space-6); }
          .detail-row {
            display: flex; align-items: flex-start; gap: var(--space-3);
            padding: var(--space-3) 0; border-bottom: 1px solid var(--border-subtle);
          }
          .detail-label {
            display: flex; align-items: center; gap: var(--space-2);
            font-size: var(--text-xs); color: var(--text-tertiary);
            font-weight: 600; text-transform: uppercase; width: 100px; flex-shrink: 0;
          }
          .detail-value { font-size: var(--text-sm); flex: 1; }
        `}</style>

        <div className="panel-header">
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Task Details</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={onEdit}><Edit2 size={14} /> Edit</button>
            <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Close panel"><X size={20} /></button>
          </div>
        </div>
        <div className="panel-body">
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>{task.title}</h3>
          {task.description && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
              {task.description}
            </p>
          )}
          <div className="detail-row">
            <span className="detail-label"><Flag size={14} /> Priority</span>
            <span className="detail-value">
              <span className={`badge badge-${task.priority}`}>{priorityMap[task.priority] || task.priority}</span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label"><Tag size={14} /> Status</span>
            <span className="detail-value badge badge-info">{statusMap[task.columnId] || task.columnId}</span>
          </div>
          {task.dueDate && (
            <div className="detail-row">
              <span className="detail-label"><Calendar size={14} /> Due</span>
              <span className="detail-value">{formatDate(task.dueDate)}</span>
            </div>
          )}
          {task.tags?.length > 0 && (
            <div className="detail-row">
              <span className="detail-label"><Tag size={14} /> Tags</span>
              <span className="detail-value" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {task.tags.map((t) => <span key={t} className="badge badge-info">{t}</span>)}
              </span>
            </div>
          )}
          {task.createdAt && (
            <div className="detail-row">
              <span className="detail-label"><Clock size={14} /> Created</span>
              <span className="detail-value">{timeAgo(task.createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
