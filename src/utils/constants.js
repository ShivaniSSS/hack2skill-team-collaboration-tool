export const PRIORITIES = [
  { value: 'critical', label: 'Critical', color: 'var(--priority-critical)' },
  { value: 'high', label: 'High', color: 'var(--priority-high)' },
  { value: 'medium', label: 'Medium', color: 'var(--priority-medium)' },
  { value: 'low', label: 'Low', color: 'var(--priority-low)' },
];

export const DEFAULT_COLUMNS = [
  { id: 'todo', name: 'To Do', order: 0 },
  { id: 'in-progress', name: 'In Progress', order: 1 },
  { id: 'in-review', name: 'In Review', order: 2 },
  { id: 'done', name: 'Done', order: 3 },
];

export const MEETING_TYPES = [
  { value: 'standup', label: 'Daily Standup', emoji: '🧍' },
  { value: 'planning', label: 'Sprint Planning', emoji: '📋' },
  { value: 'retro', label: 'Retrospective', emoji: '🔄' },
  { value: 'review', label: 'Sprint Review', emoji: '🔍' },
  { value: 'other', label: 'Other', emoji: '💬' },
];

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];
