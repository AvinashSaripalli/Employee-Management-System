export const LEAVE_TYPE_META = {
  'Casual Leave': { color: '#0284C7', bg: '#E3F4FC', short: 'CL' },
  'Sick Leave': { color: '#E11D48', bg: '#FDECEF', short: 'SL' },
  'Earned Leave': { color: '#16A34A', bg: '#E8F7EE', short: 'EL' },
  'Compensatory Off': { color: '#7C3AED', bg: '#F3E8FF', short: 'CO' },
  'Work From Home': { color: '#F59E0B', bg: '#FEF3E2', short: 'WFH' },
  'Unpaid Leave': { color: '#66708C', bg: '#EEF0F5', short: 'UL' },
  'Maternity Leave': { color: '#DB2777', bg: '#FCE7F3', short: 'ML' },
  'Paternity Leave': { color: '#0F766E', bg: '#CCFBF1', short: 'PL' },
};

export const statusColor = (status) => {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Cancelled':
      return 'default';
    case 'Pending':
      return 'warning';
    default:
      return 'default';
  }
};

export const formatLeaveDate = (value) => {
  if (!value) return '—';
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const durationLabel = (leave) => {
  if (!leave) return '';
  if (leave.half_day) {
    return `Half day (${leave.half_day_session || 'AM'})`;
  }
  const days = Number(leave.days);
  if (!Number.isNaN(days) && days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return '—';
};

export const leaveIdentityParams = () => {
  const clean = (value) => {
    if (!value || value === 'null' || value === 'undefined') return undefined;
    return value;
  };
  return {
    employeeId: clean(localStorage.getItem('userEmployeeId')),
    companyName: clean(localStorage.getItem('companyName')),
    userRole: clean(localStorage.getItem('userRole')),
    userId: clean(localStorage.getItem('userId')),
    departmentRole: clean(localStorage.getItem('departmentRole')),
    department: clean(localStorage.getItem('userDepartment')),
  };
};

