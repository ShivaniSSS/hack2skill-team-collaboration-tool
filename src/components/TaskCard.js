'use client';
import { formatDate, isDueSoon, isOverdue } from '@/utils/helpers';
import { GripVertical, Calendar, Edit2 } from 'lucide-react';

export default function TaskCard({ task, onDragStart, onDragEnd, onClick, onEdit, isDragging }) {
  const priorityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      role="listitem"
      aria-label={`Task: ${task.title}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <style jsx>{`
        .task-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          cursor: grab;
          transition: all var(--transition-fast);
          position: relative;
        }
        .task-card:hover {
          border-color: var(--border-default);
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }
        .task-card:active { cursor: grabbing; }
        .task-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }
        .task-title {
          font-size: var(--text-sm);
          font-weight: 600;
          line-height: 1.4;
          flex: 1;
        }
        .task-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
          margin-top: var(--space-2);
        }
        .task-due {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }
        .task-due.soon { color: var(--accent-warning); }
        .task-due.overdue { color: var(--accent-danger); }
        .task-tags { display: flex; gap: 4px; flex-wrap: wrap; }
        .task-tag {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          background: var(--bg-hover);
          color: var(--text-secondary);
        }
        .edit-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 3px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: opacity var(--transition-fast);
        }
        .task-card:hover .edit-btn { opacity: 1; }
        .edit-btn:hover { color: var(--text-primary); }
      `}</style>

      <div className="task-top">
        <span style={{ marginRight: 4, color: 'var(--text-tertiary)', fontSize: '12px' }}>
          {priorityEmoji[task.priority] || '🔵'}
        </span>
        <span className="task-title">{task.title}</span>
      </div>

      {task.description && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', lineHeight: 1.4 }}>
          {task.description?.length > 80 ? task.description.slice(0, 80) + '...' : task.description}
        </p>
      )}

      <div className="task-meta">
        {task.dueDate && (
          <span className={`task-due ${isOverdue(task.dueDate) ? 'overdue' : isDueSoon(task.dueDate) ? 'soon' : ''}`}>
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.tags?.length > 0 && (
          <div className="task-tags">
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="task-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <button
        className="edit-btn"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        aria-label={`Edit task ${task.title}`}
      >
        <Edit2 size={12} />
      </button>
    </div>
  );
}
