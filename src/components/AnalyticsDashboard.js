'use client';
import { useState, useEffect, useRef } from 'react';
import { subscribeToTasks } from '@/lib/firestore';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsDashboard({ projectId, project, user }) {
  const [tasks, setTasks] = useState([]);
  const statusChartRef = useRef(null);
  const priorityChartRef = useRef(null);
  const statusInstance = useRef(null);
  const priorityInstance = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeToTasks(projectId, setTasks);
    return unsub;
  }, [projectId]);

  useEffect(() => {
    if (tasks.length === 0) return;
    let Chart;
    try {
      const chartModule = require('chart.js/auto');
      Chart = chartModule.default || chartModule;
    } catch {
      return;
    }

    const todo = tasks.filter((t) => t.columnId === 'todo').length;
    const inProg = tasks.filter((t) => t.columnId === 'in-progress').length;
    const review = tasks.filter((t) => t.columnId === 'in-review').length;
    const done = tasks.filter((t) => t.columnId === 'done').length;

    const critical = tasks.filter((t) => t.priority === 'critical').length;
    const high = tasks.filter((t) => t.priority === 'high').length;
    const medium = tasks.filter((t) => t.priority === 'medium').length;
    const low = tasks.filter((t) => t.priority === 'low').length;

    // Status donut chart
    if (statusChartRef.current) {
      if (statusInstance.current) statusInstance.current.destroy();
      statusInstance.current = new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['To Do', 'In Progress', 'In Review', 'Done'],
          datasets: [{
            data: [todo, inProg, review, done],
            backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b', '#22c55e'],
            borderWidth: 0,
            spacing: 3,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 16, font: { family: 'Inter', size: 12 } } },
          },
        },
      });
    }

    // Priority bar chart
    if (priorityChartRef.current) {
      if (priorityInstance.current) priorityInstance.current.destroy();
      priorityInstance.current = new Chart(priorityChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            label: 'Tasks',
            data: [critical, high, medium, low],
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6'],
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { family: 'Inter', size: 12 } } },
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', stepSize: 1, font: { family: 'Inter', size: 12 } } },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    return () => {
      if (statusInstance.current) statusInstance.current.destroy();
      if (priorityInstance.current) priorityInstance.current.destroy();
    };
  }, [tasks]);

  return (
    <div>
      <style jsx>{`
        .analytics-header { margin-bottom: var(--space-6); }
        .analytics-title { font-size: var(--text-2xl); font-weight: 800; }
        .charts-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
        }
        .chart-card {
          background: var(--bg-surface); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg); padding: var(--space-6);
        }
        .chart-card h3 {
          font-size: var(--text-md); font-weight: 700; margin-bottom: var(--space-4);
          display: flex; align-items: center; gap: var(--space-2);
        }
        .chart-wrap { height: 280px; position: relative; }
        @media (max-width: 768px) {
          .charts-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          {project?.name} — {tasks.length} total tasks
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 'var(--space-12)' }}>
          <BarChart3 size={48} />
          <h3 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>No data yet</h3>
          <p>Create tasks to see analytics here.</p>
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>📊 Tasks by Status</h3>
            <div className="chart-wrap">
              <canvas ref={statusChartRef} aria-label="Tasks by status chart" role="img" />
            </div>
          </div>
          <div className="chart-card">
            <h3>📈 Tasks by Priority</h3>
            <div className="chart-wrap">
              <canvas ref={priorityChartRef} aria-label="Tasks by priority chart" role="img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
