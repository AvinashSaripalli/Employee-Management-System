import dayjs from 'dayjs';

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('DD MMM YYYY');
};

export const formatDateShort = (dateString) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('DD MMM');
};

export const timeToHours = (time) => {
  if (!time) return 0;
  const hoursStr = String(time);
  if (!isNaN(Number(hoursStr))) return Math.max(0, Number(hoursStr));
  const parts = hoursStr.split(':').map(Number);
  if (parts.length >= 2 && parts.every((n) => !isNaN(n))) {
    const [h, m, s] = parts;
    return Math.max(0, Math.round((h + m / 60 + (s || 0) / 3600) * 100) / 100);
  }
  return 0;
};

export const hoursToTime = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatHours = (hours) => {
  const value = timeToHours(hours);
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return `${h}h ${m}m`;
};

export const parseWorkDescription = (value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
};

export const formatWorkDescription = (value) => {
  const lines = parseWorkDescription(value);
  return lines.map((line) => `${line}`).join('\n');
};

export const downloadCSV = (filename, rows) => {
  if (!rows.length) return;
  const escapeCell = (cell) => {
    const text = cell === null || cell === undefined ? '' : String(cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = rows
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getEmployeeName = (report) => {
  const employee = report.employee || {};
  const fromEmployee = [employee.firstName, employee.lastName].filter(Boolean).join(' ');
  return fromEmployee || report.employeeName || report.employeeId || 'Unknown';
};