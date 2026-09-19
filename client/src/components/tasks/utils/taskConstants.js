export const STATUS_META = {
  1: { label: 'New', color: 'default', bg: '#F1F5F9', dot: '#94A3B8' },
  2: { label: 'Pending', color: 'info', bg: '#E0F2FE', dot: '#0284C7' },
  3: { label: 'In Progress', color: 'warning', bg: '#FEF3C2', dot: '#F59E0B' },
  4: { label: 'Review', color: 'secondary', bg: '#F5F3FF', dot: '#8B5CF6' },
  5: { label: 'Completed', color: 'success', bg: '#DCFCE7', dot: '#16A34A' },
  6: { label: 'Deferred', color: 'default', bg: '#F1F5F9', dot: '#64748B' },
  7: { label: 'Declined', color: 'error', bg: '#FFE4E6', dot: '#E11D48' },
};

export const PRIORITY_META = {
  0: { label: 'Low', color: 'default', icon: '↓' },
  1: { label: 'Normal', color: 'info', icon: '→' },
  2: { label: 'High', color: 'error', icon: '↑' },
};

export const STATUS_ACTIONS = {
  1: ['accept', 'start'],
  2: ['start', 'complete'],
  3: ['pause', 'complete'],
  4: ['approve', 'disapprove'],
  5: [],
  6: ['renew'],
  7: [],
};

export const ACTION_LABELS = {
  accept: 'Accept',
  start: 'Start',
  pause: 'Pause',
  complete: 'Complete',
  approve: 'Approve',
  disapprove: 'Disapprove',
  renew: 'Renew',
};

export const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  responsibleId: 'Assignee',
  deadline: 'Deadline',
  priority: 'Priority',
  parentId: 'Parent task',
  taskControl: 'Creator approval',
};

export const VIEW_MODES = [
  { id: 'list', label: 'List' },
  { id: 'kanban', label: 'Board' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'stats', label: 'Stats' },
];

export const STATUS_ORDER = [1,2,3,4,5,6,7];

export const STATUS_COLORS = {
  1: '#94A3B8', 2: '#0284C7', 3: '#F59E0B', 4: '#8B5CF6', 5: '#16A34A', 6: '#64748B', 7: '#E11D48',
};
export const PRIORITY_COLORS = { 0: '#94A3B8', 1: '#0284C7', 2: '#E11D48' };
