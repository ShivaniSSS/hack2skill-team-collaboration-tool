'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginPage from './login/page';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import ActivityFeed from '@/components/ActivityFeed';
import { subscribeToProjects } from '@/lib/firestore';
import { LayoutDashboard, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToProjects(user.uid, (data) => {
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    });
    return unsub;
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        currentView={currentView}
        onChangeView={setCurrentView}
        user={user}
      />
      <main style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)', background: 'var(--bg-primary)' }}>
        {currentView === 'dashboard' && (
          <DashboardView user={user} projects={projects} selectedProject={selectedProject} />
        )}
        {currentView === 'board' && selectedProject && (
          <BoardViewWrapper projectId={selectedProject.id} project={selectedProject} user={user} />
        )}
        {currentView === 'meetings' && selectedProject && (
          <MeetingsViewWrapper projectId={selectedProject.id} project={selectedProject} user={user} />
        )}
        {currentView === 'analytics' && selectedProject && (
          <AnalyticsViewWrapper projectId={selectedProject.id} project={selectedProject} user={user} />
        )}
        {currentView === 'chat' && selectedProject && (
          <ChatViewWrapper projectId={selectedProject.id} project={selectedProject} user={user} />
        )}
      </main>
    </div>
  );
}

function DashboardView({ user, projects, selectedProject }) {
  return (
    <div>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Welcome back, {user.displayName?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-md)' }}>
          Here&apos;s what&apos;s happening across your projects
        </p>
      </header>
      {selectedProject ? (
        <>
          <DashboardStats projectId={selectedProject.id} />
          <div style={{ marginTop: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              Recent Activity
            </h2>
            <ActivityFeed projectId={selectedProject.id} />
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ marginTop: 'var(--space-16)' }}>
          <LayoutDashboard size={48} />
          <h3 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>No projects yet</h3>
          <p>Create your first project from the sidebar to get started!</p>
        </div>
      )}
    </div>
  );
}

/* Lazy-loaded view wrappers */
function BoardViewWrapper({ projectId, project, user }) {
  const KanbanBoard = require('@/components/KanbanBoard').default;
  return <KanbanBoard projectId={projectId} project={project} user={user} />;
}

function MeetingsViewWrapper({ projectId, project, user }) {
  const MeetingNotes = require('@/components/MeetingNotes').default;
  return <MeetingNotes projectId={projectId} project={project} user={user} />;
}

function AnalyticsViewWrapper({ projectId, project, user }) {
  const AnalyticsDashboard = require('@/components/AnalyticsDashboard').default;
  return <AnalyticsDashboard projectId={projectId} project={project} user={user} />;
}

function ChatViewWrapper({ projectId, project, user }) {
  const ChatPanel = require('@/components/ChatPanel').default;
  return <ChatPanel projectId={projectId} user={user} fullPage />;
}
