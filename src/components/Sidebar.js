'use client';
import { useState } from 'react';
import { signOut } from '@/lib/auth';
import { createProject } from '@/lib/firestore';
import { useToast } from '@/context/ToastContext';
import { getInitials } from '@/utils/helpers';
import { PROJECT_COLORS } from '@/utils/constants';
import {
  LayoutDashboard, KanbanSquare, Calendar, BarChart3, MessageSquare,
  Plus, LogOut, Settings, ChevronDown, FolderKanban, Users
} from 'lucide-react';

export default function Sidebar({ projects, selectedProject, onSelectProject, currentView, onChangeView, user }) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board', label: 'Kanban Board', icon: KanbanSquare },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const color = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
      await createProject({
        name: newName.trim(),
        description: '',
        color,
        owner: user.uid,
        members: [user.uid],
      });
      setNewName('');
      setShowNewProject(false);
      addToast('Project created!', 'success');
    } catch (err) {
      addToast('Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5) var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
        }
        .brand-logo {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: var(--text-md);
          flex-shrink: 0;
        }
        .brand-text {
          font-size: var(--text-md);
          font-weight: 800;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sidebar-section {
          padding: var(--space-3) var(--space-3);
        }
        .section-label {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: var(--space-2) var(--space-2);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-size: var(--text-sm);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .nav-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .nav-btn.active {
          background: var(--accent-primary-muted);
          color: var(--accent-primary);
        }
        .project-btn {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-size: var(--text-sm);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .project-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .project-btn.active { background: var(--bg-hover); color: var(--text-primary); }
        .project-dot {
          width: 10px;
          height: 10px;
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }
        .projects-list {
          flex: 1;
          overflow-y: auto;
        }
        .new-project-form {
          display: flex;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-2);
        }
        .sidebar-footer {
          padding: var(--space-3) var(--space-4);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-name {
          font-size: var(--text-sm);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-email {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      <div className="sidebar-brand">
        <div className="brand-logo">T</div>
        <span className="brand-text">TeamSync</span>
      </div>

      <div className="sidebar-section">
        <div className="section-label">Navigation</div>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-btn ${currentView === id ? 'active' : ''}`}
            onClick={() => onChangeView(id)}
            aria-current={currentView === id ? 'page' : undefined}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <div className="projects-list">
        <div className="sidebar-section">
          <div className="section-label">
            Projects
            <button
              className="btn-ghost btn-icon"
              onClick={() => setShowNewProject(!showNewProject)}
              aria-label="Create new project"
              style={{ padding: '2px' }}
            >
              <Plus size={16} />
            </button>
          </div>

          {showNewProject && (
            <form className="new-project-form" onSubmit={handleCreateProject}>
              <input
                className="input"
                placeholder="Project name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                aria-label="New project name"
                style={{ fontSize: 'var(--text-xs)', padding: '6px 8px' }}
              />
              <button className="btn btn-primary btn-sm" type="submit" disabled={creating}>
                {creating ? '...' : 'Add'}
              </button>
            </form>
          )}

          {projects.map((proj) => (
            <button
              key={proj.id}
              className={`project-btn ${selectedProject?.id === proj.id ? 'active' : ''}`}
              onClick={() => onSelectProject(proj)}
            >
              <span className="project-dot" style={{ background: proj.color || 'var(--accent-primary)' }} />
              <span className="truncate">{proj.name}</span>
            </button>
          ))}

          {projects.length === 0 && !showNewProject && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', padding: 'var(--space-2) var(--space-3)' }}>
              No projects yet
            </p>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="avatar avatar-sm" referrerPolicy="no-referrer" />
        ) : (
          <div className="avatar avatar-sm avatar-placeholder">{getInitials(user.displayName)}</div>
        )}
        <div className="user-info">
          <div className="user-name">{user.displayName}</div>
          <div className="user-email">{user.email}</div>
        </div>
        <button className="btn-ghost btn-icon" onClick={signOut} aria-label="Sign out" title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
