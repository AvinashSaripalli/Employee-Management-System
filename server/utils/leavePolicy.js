const HOLIDAYS = [
  { date: "2025-01-26", name: "Republic Day" },
  { date: "2025-03-14", name: "Holi" },
  { date: "2025-03-31", name: "Id-ul-Fitr" },
  { date: "2025-04-14", name: "Ambedkar Jayanti" },
  { date: "2025-05-01", name: "Labour Day" },
  { date: "2025-08-15", name: "Independence Day" },
  { date: "2025-10-02", name: "Gandhi Jayanti" },
  { date: "2025-10-22", name: "Dussehra" },
  { date: "2025-11-01", name: "Diwali" },
  { date: "2025-12-25", name: "Christmas" },
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-03-04", name: "Holi" },
  { date: "2026-04-14", name: "Ambedkar Jayanti" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-11-08", name: "Diwali" },
  { date: "2026-12-25", name: "Christmas" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-01-26", name: "Republic Day" },
  { date: "2027-08-15", name: "Independence Day" },
  { date: "2027-10-02", name: "Gandhi Jayanti" },
  { date: "2027-12-25", name: "Christmas" },
];

const HOLIDAY_SET = new Set(HOLIDAYS.map((h) => h.date));

const LEAVE_TYPES = {
  "Casual Leave": {
    code: "CL",
    allocated: 12,
    allowPast: false,
    minNoticeDays: 0,
    paid: true,
  },
  "Sick Leave": {
    code: "SL",
    allocated: 12,
    allowPast: true,
    maxPastDays: 7,
    minNoticeDays: 0,
    paid: true,
  },
  "Earned Leave": {
    code: "EL",
    allocated: 15,
    allowPast: false,
    minNoticeDays: 1,
    paid: true,
  },
  "Compensatory Off": {
    code: "CO",
    allocated: 6,
    allowPast: false,
    minNoticeDays: 0,
    paid: true,
  },
  "Work From Home": {
    code: "WFH",
    allocated: 24,
    allowPast: false,
    minNoticeDays: 0,
    paid: true,
  },
  "Unpaid Leave": {
    code: "UL",
    allocated: null,
    allowPast: false,
    minNoticeDays: 0,
    paid: false,
  },
  "Maternity Leave": {
    code: "ML",
    allocated: 182,
    allowPast: false,
    minNoticeDays: 15,
    paid: true,
    gender: "Female",
  },
  "Paternity Leave": {
    code: "PL",
    allocated: 15,
    allowPast: false,
    minNoticeDays: 3,
    paid: true,
    gender: "Male",
  },
};

const ACTIVE_STATUSES = ["Pending", "Approved"];

function parseDate(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  const [y, m, d] = text.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date) {
  return HOLIDAY_SET.has(formatDate(date));
}

function eachDate(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  const dates = [];
  if (!start || !end || start > end) return dates;
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(new Date(cursor));
  }
  return dates;
}

function countWorkingDays(startValue, endValue, halfDay = false) {
  if (halfDay) return 0.5;
  const working = eachDate(startValue, endValue).filter((d) => !isWeekend(d) && !isHoliday(d));
  return working.length;
}

function rangesOverlap(startA, endA, startB, endB) {
  return parseDate(startA) <= parseDate(endB) && parseDate(startB) <= parseDate(endA);
}

function sessionsConflict(leaveA, leaveB) {
  if (!rangesOverlap(leaveA.start_date, leaveA.end_date, leaveB.start_date, leaveB.end_date)) {
    return false;
  }
  const sameDay =
    String(leaveA.start_date).slice(0, 10) === String(leaveB.start_date).slice(0, 10) &&
    String(leaveA.end_date).slice(0, 10) === String(leaveB.end_date).slice(0, 10);
  if (sameDay && leaveA.half_day && leaveB.half_day) {
    const sessionA = leaveA.half_day_session || "AM";
    const sessionB = leaveB.half_day_session || "AM";
    return sessionA === sessionB;
  }
  return true;
}

function getLeaveType(name) {
  return LEAVE_TYPES[name] || null;
}

function canApproveRole(role) {
  return role === "Admin" || role === "Manager";
}

module.exports = {
  HOLIDAYS,
  LEAVE_TYPES,
  ACTIVE_STATUSES,
  parseDate,
  formatDate,
  todayDate,
  addDays,
  isWeekend,
  isHoliday,
  eachDate,
  countWorkingDays,
  rangesOverlap,
  sessionsConflict,
  getLeaveType,
  canApproveRole,
};
