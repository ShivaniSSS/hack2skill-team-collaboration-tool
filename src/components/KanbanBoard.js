'use client';
import { useState, useEffect } from 'react';
import { subscribeToTasks, updateTask, logActivity } from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskDetailPanel from './TaskDetailPanel';
import { Plus, Search, Filter } from 'lucide-react';

export default function KanbanBoard({ projectId, project, user }) {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [dragState, setDragState] = useState({ taskId: null, overColumn: null });
  const { addToast } = useToast();

  const columns = project?.columns || [
    { id: 'todo', name: 'To Do', order: 0 },
    { id: 'in-progress', name: 'In Progress', order: 1 },
    { id: 'in-review', name: 'In Review', order: 2 },
    { id: 'done', name: 'Done', order: 3 },
  ];

  useEffect(() => {
    const unsub = subscribeToTasks(projectId, setTasks);
    return unsub;
  }, [projectId]);

  const filtered = tasks.filter((t) => {
    if (searchQuery && !t.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ taskId, overColumn: null });
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState((prev) => ({ ...prev, overColumn: columnId }));
  };

  const handleDragLeave = () => {
    setDragState((prev) => ({ ...prev, overColumn: null }));
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.columnId !== columnId) {
      try {
        await updateTask(projectId, taskId, { columnId });
        const colName = columns.find((c) => c.id === columnId)?.name;
        await logActivity(projectId, {
          action: 'moved',
          actor: user.uid,
          actorName: user.displayName,
          target: task.title,
          details: `to ${colName}`,
        });
        if (columnId === 'done') {
          addToast(`"${task.title}" completed! 🎉`, 'success');
        }
      } catch (err) {
        addToast('Failed to move task', 'error');
      }
    }
    setDragState({ taskId: null, overColumn: null });
  };

  const handleDragEnd = () => {
    setDragState({ taskId: null, overColumn: null });
  };

  return (
    <div>
      <style jsx>{`
        .board-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
          gap: var(--space-3);
        }
        .board-title { font-size: var(--text-2xl); font-weight: 800; }
        .board-actions { display: flex; align-items: center; gap: var(--space-3); }
        .search-box {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-1) var(--space-3);
        }
        .search-box input {
          border: none;
          background: none;
          color: var(--text-primary);
          font-family: var(--font-family);
          font-size: var(--text-sm);
          outline: none;
          width: 180px;
        }
        .columns-container {
          display: flex;
          gap: var(--space-4);
          overflow-x: auto;
          padding-bottom: var(--space-4);
          min-height: calc(100vh - 180px);
        }
        .column {
          flex: 0 0 290px;
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          max-height: calc(100vh - 180px);
          transition: border-color var(--transition-fast);
        }
        .column.drag-over {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-glow);
        }
        .column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
        }
        .column-title {
          font-size: var(--text-sm);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .column-count {
          background: var(--bg-hover);
          color: var(--text-secondary);
          font-size: var(--text-xs);
          font-weight: 600;
          padding: 1px 8px;
          border-radius: var(--radius-full);
        }
        .column-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
      `}</style>

      <div className="board-header">
        <h1 className="board-title">{project?.name || 'Kanban Board'}</h1>
        <div className="board-actions">
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
            />
          </div>
          <select
            className="select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            aria-label="Filter by priority"
            style={{ width: 'auto', fontSize: 'var(--text-xs)', padding: '6px 28px 6px 10px' }}
          >
            <option value="">All Priorities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🔵 Low</option>
          </select>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      <div className="columns-container" role="region" aria-label="Kanban board">
        {columns.sort((a, b) => a.order - b.order).map((col) => {
          const colTasks = filtered.filter((t) => t.columnId === col.id);
          return (
            <div
              key={col.id}
              className={`column ${dragState.overColumn === col.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              role="list"
              aria-label={`${col.name} column, ${colTasks.length} tasks`}
            >
              <div className="column-header">
                <span className="column-title">
                  {col.name}
                  <span className="column-count">{colTasks.length}</span>
                </span>
                <button
                  className="btn-ghost btn-icon"
                  onClick={() => { setEditTask({ columnId: col.id }); setShowModal(true); }}
                  aria-label={`Add task to ${col.name}`}
                  style={{ padding: 2 }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="column-body">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setDetailTask(task)}
                    onEdit={() => { setEditTask(task); setShowModal(true); }}
                    isDragging={dragState.taskId === task.id}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
                    <p style={{ fontSize: 'var(--text-xs)' }}>Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <TaskModal
          projectId={projectId}
          task={editTask}
          user={user}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}

      {detailTask && (
        <TaskDetailPanel
          task={detailTask}
          projectId={projectId}
          user={user}
          onClose={() => setDetailTask(null)}
          onEdit={() => { setEditTask(detailTask); setShowModal(true); setDetailTask(null); }}
        />
      )}
    </div>
  );
}
