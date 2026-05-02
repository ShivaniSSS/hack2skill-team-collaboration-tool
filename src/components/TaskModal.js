'use client';
import { useState } from 'react';
import { createTask, updateTask, deleteTask, logActivity } from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';
import { PRIORITIES } from '@/utils/constants';
import { X, Trash2 } from 'lucide-react';

export default function TaskModal({ projectId, task, user, onClose }) {
  const isEdit = task?.id;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [columnId, setColumnId] = useState(task?.columnId || 'todo');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate.seconds ? task.dueDate.seconds * 1000 : task.dueDate).toISOString().split('T')[0] : '');
  const [tags, setTags] = useState(task?.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const data = {
      title: title.trim(),
      description: description.trim(),
      priority,
      columnId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      assignee: user.uid,
      order: Date.now(),
    };
    try {
      if (isEdit) {
        await updateTask(projectId, task.id, data);
        await logActivity(projectId, {
          action: 'updated', actor: user.uid, actorName: user.displayName, target: data.title,
        });
        addToast('Task updated', 'success');
      } else {
        data.createdBy = user.uid;
        await createTask(projectId, data);
        await logActivity(projectId, {
          action: 'created', actor: user.uid, actorName: user.displayName, target: data.title,
        });
        addToast('Task created', 'success');
      }
      onClose();
    } catch (err) {
      addToast('Failed to save task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    try {
      await deleteTask(projectId, task.id);
      await logActivity(projectId, {
        action: 'deleted', actor: user.uid, actorName: user.displayName, target: task.title,
      });
      addToast('Task deleted', 'info');
      onClose();
    } catch (err) {
      addToast('Failed to delete task', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit task' : 'Create task'}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label className="label" htmlFor="task-title">Title *</label>
              <input id="task-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." required autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="task-desc">Description</label>
              <textarea id="task-desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task..." rows={3} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label className="label" htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="task-status">Status</label>
                <select id="task-status" className="select" value={columnId} onChange={(e) => setColumnId(e.target.value)}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="task-due">Due Date</label>
              <input id="task-due" className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="task-tags">Tags (comma-separated)</label>
              <input id="task-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="bug, frontend, urgent" />
            </div>
          </div>
          <div className="modal-footer">
            {isEdit && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginRight: 'auto' }}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
