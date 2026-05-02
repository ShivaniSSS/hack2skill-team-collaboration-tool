'use client';
import { useState, useEffect } from 'react';
import { subscribeToMeetings, subscribeToMeetingTodos, updateMeetingTodo } from '@/lib/firestore';
import { CheckSquare, Square, Calendar, User, Clock } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export default function PersonalisedTodos({ projectId, user }) {
  const [meetings, setMeetings] = useState([]);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    return subscribeToMeetings(projectId, setMeetings);
  }, [projectId]);

  useEffect(() => {
    if (!meetings.length) {
      setTodos([]);
      return;
    }

    const unsubs = [];
    const todosMap = new Map();

    const updateTodos = () => {
      const allTodos = Array.from(todosMap.values()).flat();
      const myTodos = allTodos.filter(t => t.assigneeUid === user.uid);
      // Sort by incomplete first, then by date
      myTodos.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
      });
      setTodos(myTodos);
    };

    meetings.forEach(meeting => {
      const unsub = subscribeToMeetingTodos(meeting.id, (meetingTodos) => {
        const enhancedTodos = meetingTodos.map(t => ({ 
          ...t, 
          meetingId: meeting.id, 
          meetingTitle: meeting.title,
          meetingDate: meeting.date || meeting.createdAt
        }));
        todosMap.set(meeting.id, enhancedTodos);
        updateTodos();
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [meetings, user.uid]);

  const toggleTodo = async (todo) => {
    await updateMeetingTodo(todo.meetingId, todo.id, { completed: !todo.completed });
  };

  return (
    <div className="personalised-todos">
      {todos.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <CheckSquare size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No meeting todos assigned to you.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {todos.map(todo => (
            <div key={`${todo.meetingId}-${todo.id}`} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              transition: 'all var(--transition-fast)'
            }}>
              <button 
                onClick={() => toggleTodo(todo)}
                style={{ 
                  color: todo.completed ? 'var(--accent-success)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginTop: '2px'
                }}
              >
                {todo.completed ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 'var(--text-sm)', 
                  fontWeight: 500,
                  color: todo.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  marginBottom: 'var(--space-1)'
                }}>
                  {todo.text}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-3)',
                  flexWrap: 'wrap',
                  marginTop: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    <User size={12} />
                    <span>{todo.assignee || user.displayName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    <Calendar size={12} />
                    <span>{todo.meetingTitle}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    <Clock size={12} />
                    <span>{formatDate(todo.meetingDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
