'use client';
import { useState, useEffect } from 'react';
import { subscribeToMeetings, createMeeting, createMeetingTodo, subscribeToMeetingTodos, updateMeetingTodo, deleteMeetingTodo } from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';
import { MEETING_TYPES } from '@/utils/constants';
import { formatDate, timeAgo, getInitials } from '@/utils/helpers';
import { Plus, Calendar, Users, CheckSquare, Square, Trash2, X, ChevronDown, ChevronRight, UserCircle } from 'lucide-react';

export default function MeetingNotes({ projectId, project, user }) {
  const [meetings, setMeetings] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToMeetings(projectId, setMeetings);
    return unsub;
  }, [projectId]);

  return (
    <div>
      <style jsx>{`
        .meetings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); }
        .meetings-title { font-size: var(--text-2xl); font-weight: 800; }
        .meetings-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .meeting-card {
          background: var(--bg-surface); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg); overflow: hidden; transition: all var(--transition-fast);
        }
        .meeting-card:hover { border-color: var(--border-default); }
        .meeting-head {
          display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5);
          cursor: pointer; user-select: none;
        }
        .meeting-emoji { font-size: var(--text-xl); }
        .meeting-info { flex: 1; }
        .meeting-name { font-weight: 700; font-size: var(--text-md); }
        .meeting-meta { font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 2px; }
        .meeting-body { padding: 0 var(--space-5) var(--space-5); }
        .todo-section-title {
          font-size: var(--text-xs); font-weight: 700; color: var(--text-tertiary);
          text-transform: uppercase; letter-spacing: 0.05em; margin: var(--space-4) 0 var(--space-2);
          display: flex; align-items: center; gap: var(--space-2);
        }
        .todo-item {
          display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .todo-check { cursor: pointer; color: var(--text-tertiary); flex-shrink: 0; transition: color var(--transition-fast); }
        .todo-check:hover { color: var(--accent-primary); }
        .todo-check.done { color: var(--accent-success); }
        .todo-text { flex: 1; font-size: var(--text-sm); }
        .todo-text.done { text-decoration: line-through; color: var(--text-tertiary); }
        .todo-assignee {
          font-size: var(--text-xs); color: var(--text-secondary);
          background: var(--bg-hover); padding: 1px 8px; border-radius: var(--radius-full);
        }
        .add-todo-row { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
      `}</style>

      <div className="meetings-header">
        <div>
          <h1 className="meetings-title">Meeting Notes</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Track action items and todos from scrums and meetups
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> New Meeting
        </button>
      </div>

      {showCreate && (
        <CreateMeetingForm
          projectId={projectId}
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => addToast('Meeting created', 'success')}
        />
      )}

      <div className="meetings-list">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="meeting-card">
            <div className="meeting-head" onClick={() => setExpanded(expanded === meeting.id ? null : meeting.id)}>
              {expanded === meeting.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span className="meeting-emoji">{MEETING_TYPES.find((t) => t.value === meeting.type)?.emoji || '💬'}</span>
              <div className="meeting-info">
                <div className="meeting-name">{meeting.title}</div>
                <div className="meeting-meta">
                  {MEETING_TYPES.find((t) => t.value === meeting.type)?.label} · {meeting.date || timeAgo(meeting.createdAt)}
                </div>
              </div>
            </div>
            {expanded === meeting.id && (
              <div className="meeting-body">
                {meeting.notes && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                    {meeting.notes}
                  </p>
                )}
                <MeetingTodos meetingId={meeting.id} user={user} />
              </div>
            )}
          </div>
        ))}

        {meetings.length === 0 && !showCreate && (
          <div className="empty-state" style={{ marginTop: 'var(--space-8)' }}>
            <Calendar size={48} />
            <h3 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>No meetings yet</h3>
            <p>Create your first meeting to start tracking action items.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateMeetingForm({ projectId, user, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('standup');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createMeeting({ title: title.trim(), type, date, notes, projectId, createdBy: user.uid, attendees: [user.uid] });
      onCreated();
      onClose();
    } catch { /* error handled via toast in parent */ }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Create meeting">
        <div className="modal-header">
          <h2>New Meeting</h2>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label className="label" htmlFor="mt-title">Title *</label>
              <input id="mt-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Daily Standup — May 2" required autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label className="label" htmlFor="mt-type">Type</label>
                <select id="mt-type" className="select" value={type} onChange={(e) => setType(e.target.value)}>
                  {MEETING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="mt-date">Date</label>
                <input id="mt-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="mt-notes">Notes</label>
              <textarea id="mt-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Meeting notes..." rows={3} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>{saving ? 'Creating...' : 'Create Meeting'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MeetingTodos({ meetingId, user }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [assignee, setAssignee] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToMeetingTodos(meetingId, setTodos);
    return unsub;
  }, [meetingId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      await createMeetingTodo(meetingId, {
        text: newTodo.trim(),
        assignee: assignee.trim() || user.displayName,
        assigneeUid: user.uid,
      });
      setNewTodo('');
      setAssignee('');
    } catch {
      addToast('Failed to add todo', 'error');
    }
  };

  const toggleTodo = async (todo) => {
    await updateMeetingTodo(meetingId, todo.id, { completed: !todo.completed });
  };

  const removeTodo = async (todoId) => {
    await deleteMeetingTodo(meetingId, todoId);
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div>
      <div className="todo-section-title">
        <CheckSquare size={14} /> Action Items ({completedCount}/{todos.length})
      </div>
      {todos.map((todo) => (
        <div key={todo.id} className="todo-item">
          <button className={`todo-check ${todo.completed ? 'done' : ''}`} onClick={() => toggleTodo(todo)} aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}>
            {todo.completed ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
          <span className={`todo-text ${todo.completed ? 'done' : ''}`}>{todo.text}</span>
          <span className="todo-assignee">{todo.assignee}</span>
          <button className="btn-ghost btn-icon" onClick={() => removeTodo(todo.id)} aria-label="Delete todo" style={{ padding: 2, color: 'var(--text-tertiary)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <form className="add-todo-row" onSubmit={handleAdd}>
        <input className="input" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add action item..." style={{ flex: 2, fontSize: 'var(--text-xs)', padding: '6px 8px' }} />
        <input className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Assignee" style={{ flex: 1, fontSize: 'var(--text-xs)', padding: '6px 8px' }} />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!newTodo.trim()}>Add</button>
      </form>
    </div>
  );
}
