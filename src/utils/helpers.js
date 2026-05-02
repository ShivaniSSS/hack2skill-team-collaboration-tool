export function formatDate(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function isDueSoon(dueDate) {
  if (!dueDate) return false;
  const d = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
  const diff = d.getTime() - Date.now();
  return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const d = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
  return d.getTime() < Date.now();
}
