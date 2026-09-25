import { useMemo } from 'react';
import { STATUS_META, PRIORITY_META } from '../utils/taskConstants';

export default function useTaskStats(tasks, users = [], currentEmployeeId = '') {
  return useMemo(() => {
    const statusCounts = {};
    const priorityCounts = {};
    Object.keys(STATUS_META).forEach(k => { statusCounts[k] = 0; });
    Object.keys(PRIORITY_META).forEach(k => { priorityCounts[k] = 0; });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workloadMap = {};
    const overdueList = [];
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;

    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;

      if (task.status === 5) completed += 1;
      if (task.status === 3) inProgress += 1;

      const key = task.responsibleId || 'Unassigned';
      workloadMap[key] = workloadMap[key] || { count: 0, completed: 0 };
      workloadMap[key].count += 1;
      if (task.status === 5) workloadMap[key].completed += 1;

      const dl = task.deadline ? new Date(task.deadline) : null;
      if (dl && task.status !== 5 && task.status !== 7 && dl < today) {
        overdue += 1;
        const daysOver = Math.max(1, Math.round((today - dl) / 86400000));
        const respUser = users.find(x => x.employeeId === task.responsibleId);
        const respName = respUser
          ? `${respUser.firstName} ${respUser.lastName}`
          : task.responsible
          ? `${task.responsible.firstName} ${task.responsible.lastName}`
          : task.responsibleId || 'Unassigned';
        overdueList.push({ ...task, daysOver, respName });
      }
    });

    const workload = Object.entries(workloadMap).map(([employeeId, w]) => {
      const u = users.find(x => x.employeeId === employeeId);
      const name = u
        ? `${u.firstName} ${u.lastName} (${employeeId})`
        : employeeId === 'Unassigned'
        ? 'Unassigned'
        : employeeId;
      return {
        employeeId,
        name,
        photo: u?.photo || '',
        count: w.count,
        completed: w.completed,
        pending: w.count - w.completed,
        pct: w.count ? Math.round((w.completed / w.count) * 100) : 0,
      };
    }).sort((a, b) => b.count - a.count);

    const monthly = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({ name: d.toLocaleString('en', { month: 'short' }), created: 0 });
    }

    tasks.forEach(task => {
      const created = new Date(task.createdAt);
      const monthIdx = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      if (monthIdx >= 0 && monthIdx < 12) {
        monthly[11 - monthIdx].created += 1;
      }
    });

    return {
      total: tasks.length,
      completed,
      inProgress,
      overdue,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      myTasks: tasks.filter(t => t.responsibleId === currentEmployeeId).length,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status: Number(status), count })),
      byPriority: Object.entries(priorityCounts).map(([priority, count]) => ({ priority: Number(priority), count })),
      monthly,
      workload,
      overdueList: overdueList.sort((a, b) => b.daysOver - a.daysOver),
    };
  }, [tasks, users, currentEmployeeId]);
}
