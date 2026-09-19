import { FIELD_LABELS } from './taskConstants';

export const describeActivity = (a, userList = []) => {
  const userName = (id) => {
    const found = userList.find((u) => u.employeeId === id);
    return found ? `${found.firstName} ${found.lastName}` : id;
  };
  switch (a.action) {
    case 'create': return 'created this task';
    case 'status': return `changed status from "${a.oldValue || '—'}" to "${a.newValue}"`;
    case 'update': {
      const label = FIELD_LABELS[a.field] || a.field;
      if (a.oldValue && a.newValue) return `updated ${label} from "${a.oldValue}" to "${a.newValue}"`;
      if (a.newValue) return `set ${label} to "${a.newValue}"`;
      if (a.oldValue) return `cleared ${label} ("${a.oldValue}")`;
      return `updated ${label}`;
    }
    case 'checklist_add': return `added checklist item "${a.newValue}"`;
    case 'checklist_update': return `renamed checklist item "${a.oldValue}" to "${a.newValue}"`;
    case 'checklist_toggle': return a.newValue === 'Complete' ? `completed checklist item "${a.field}"` : `reopened checklist item "${a.field}"`;
    case 'checklist_delete': return `removed checklist item "${a.oldValue}"`;
    case 'member_add': return `added ${a.field}: ${userName(a.newValue)}`;
    case 'member_remove': return `removed ${a.field}: ${userName(a.oldValue)}`;
    case 'delete': return 'deleted this task';
    case 'comment': return `commented: "${a.newValue}"`;
    case 'attachment': return `attached file "${a.newValue}"`;
    default: return a.action;
  }
};

export const getProgress = (checklist) => {
  if (!checklist || checklist.length === 0) return { done: 0, total: 0, pct: 0 };
  const total = checklist.length;
  const done = checklist.filter((c) => c.isComplete).length;
  return { done, total, pct: Math.round((done / total) * 100) };
};

export const isOverdue = (task) => {
  if (!task.deadline || task.status === 5 || task.status === 7) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.deadline) < today;
};

export const daysOver = (task) => {
  if (!isOverdue(task)) return 0;
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.max(1, Math.round((today - new Date(task.deadline)) / (86400000)));
};

export const buildTree = (tasks) => {
  const map = new Map(tasks.map(t=>[String(t.id), {...t, children:[]}]));
  const roots=[];
  for(const t of map.values()){
    if(t.parentId && map.has(String(t.parentId))){
      map.get(String(t.parentId)).children.push(t);
    } else roots.push(t);
  }
  return roots;
};

export const formatDeadline = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
