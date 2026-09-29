import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
  Avatar,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
} from '@mui/material';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineCog6Tooth,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import dayjs from 'dayjs';
import axios from '../../api/axios';

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const PRESET_COLORS = ['#14286D', '#059669', '#7C3AED', '#D97706', '#DC2626', '#2563EB', '#0891B2'];

const ShiftRosterHub = ({ isAdmin, isSupervisor, isEmployee, userDepartment, userEmployeeId }) => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [shifts, setShifts] = useState([]);
  const [rosterMap, setRosterMap] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(isAdmin ? 'all' : userDepartment || 'all');
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [shiftMasterOpen, setShiftMasterOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [singleAssignOpen, setSingleAssignOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { employee, date }

  // Forms
  const [shiftForm, setShiftForm] = useState({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    halfDayHours: 4.0,
    fullDayHours: 8.0,
    color: '#14286D',
  });
  const [editingShiftId, setEditingShiftId] = useState(null);

  const [bulkForm, setBulkForm] = useState({
    department: 'all',
    startDate: selectedMonth.startOf('month').format('YYYY-MM-DD'),
    endDate: selectedMonth.endOf('month').format('YYYY-MM-DD'),
    weekdayShiftId: '',
    weeklyOffDays: [0, 6], // Sunday & Saturday
  });

  const [singleForm, setSingleForm] = useState({
    shiftId: '',
    isWeeklyOff: false,
    notes: '',
  });

  const companyName = localStorage.getItem('companyName') || 'KN Advisors';
  const canManage = isAdmin || isSupervisor;

  // Days in selected month
  const daysInMonth = useMemo(() => {
    const totalDays = selectedMonth.daysInMonth();
    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = selectedMonth.date(d);
      days.push({
        dayNumber: d,
        dateKey: dateObj.format('YYYY-MM-DD'),
        weekday: dateObj.format('ddd'),
        isWeekend: dateObj.day() === 0 || dateObj.day() === 6,
        isToday: dateObj.isSame(dayjs(), 'day'),
      });
    }
    return days;
  }, [selectedMonth]);

  // 1. Fetch shifts
  const fetchShifts = async () => {
    try {
      const res = await axios.get('/shifts', { params: { companyName } });
      const list = res.data?.shifts || [];
      setShifts(list);
      if (list.length > 0 && !bulkForm.weekdayShiftId) {
        setBulkForm((prev) => ({ ...prev, weekdayShiftId: list[0].id }));
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
    }
  };

  // 2. Fetch employees
  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/users/employees', { params: { companyName } });
      const userList = res.data || [];
      setEmployees(userList);

      // Extract unique departments
      const depts = [...new Set(userList.map((u) => u.department).filter(Boolean))];
      setDepartments(depts);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // 3. Fetch roster matrix
  const fetchRoster = async () => {
    setLoading(true);
    try {
      const from = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const to = selectedMonth.endOf('month').format('YYYY-MM-DD');
      const params = {
        companyName,
        from,
        to,
        department: selectedDept !== 'all' ? selectedDept : undefined,
        employeeId: isEmployee ? userEmployeeId : undefined,
      };

      const res = await axios.get('/shifts/roster', { params });
      setRosterMap(res.data?.rosterMap || {});
    } catch (err) {
      console.error('Error fetching roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [selectedMonth, selectedDept]);

  // Filtered employees for table
  const displayedEmployees = useMemo(() => {
    if (isEmployee) {
      return employees.filter((e) => e.employeeId === userEmployeeId);
    }
    if (selectedDept !== 'all') {
      return employees.filter((e) => e.department === selectedDept);
    }
    return employees;
  }, [employees, selectedDept, isEmployee, userEmployeeId]);

  // Handle shift master submit
  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShiftId) {
        await axios.put(`/shifts/${editingShiftId}`, shiftForm);
      } else {
        await axios.post('/shifts', shiftForm);
      }
      setShiftForm({
        name: '',
        code: '',
        startTime: '09:00',
        endTime: '18:00',
        graceMinutes: 15,
        halfDayHours: 4.0,
        fullDayHours: 8.0,
        color: '#14286D',
      });
      setEditingShiftId(null);
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save shift.');
    }
  };

  const handleDeleteShift = async (shift) => {
    if (!window.confirm(`Are you sure you want to delete shift '${shift.name}'?`)) return;
    try {
      await axios.delete(`/shifts/${shift.id}`);
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete shift.');
    }
  };

  // Handle cell click (single assign)
  const handleCellClick = (emp, day) => {
    if (!canManage) return;
    const existing = rosterMap[emp.employeeId]?.[day.dateKey];
    setActiveCell({ employee: emp, day });
    setSingleForm({
      shiftId: existing?.shiftId || (shifts[0]?.id || ''),
      isWeeklyOff: existing ? !!existing.isWeeklyOff : day.isWeekend,
      notes: existing?.notes || '',
    });
    setSingleAssignOpen(true);
  };

  const handleSingleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!activeCell) return;
    try {
      await axios.post('/shifts/assign-roster', {
        employeeId: activeCell.employee.employeeId,
        dates: [activeCell.day.dateKey],
        shiftId: singleForm.isWeeklyOff ? null : singleForm.shiftId,
        isWeeklyOff: singleForm.isWeeklyOff,
        notes: singleForm.notes,
      });
      setSingleAssignOpen(false);
      setActiveCell(null);
      fetchRoster();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign shift.');
    }
  };

  // Handle bulk assign submit
  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/shifts/bulk-roster', bulkForm);
      alert('Roster schedule applied successfully!');
      setBulkAssignOpen(false);
      fetchRoster();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to apply bulk roster.');
    }
  };

  const getInitials = (name) => {
    return (name || 'E')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top Controls Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HiOutlineCalendarDays size={22} color="#14286D" />
            Shift Scheduling & Roster Planner
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
            {canManage
              ? 'Define enterprise shifts, assign team coverage schedules, and configure weekly offs'
              : 'View your scheduled monthly shifts, working hours, and assigned weekly off days'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {canManage && (
            <>
              <Button
                variant="outlined"
                startIcon={<HiOutlineCog6Tooth size={18} />}
                onClick={() => setShiftMasterOpen(true)}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  borderColor: '#DDE4FF',
                  color: '#14286D',
                  bgcolor: '#ffffff',
                  fontSize: '13px',
                  '&:hover': { bgcolor: '#EEF2FF', borderColor: '#14286D' },
                }}
              >
                Shift Master
              </Button>

              <Button
                variant="contained"
                startIcon={<HiOutlineSparkles size={18} />}
                onClick={() => {
                  setBulkForm({
                    department: selectedDept !== 'all' ? selectedDept : 'all',
                    startDate: selectedMonth.startOf('month').format('YYYY-MM-DD'),
                    endDate: selectedMonth.endOf('month').format('YYYY-MM-DD'),
                    weekdayShiftId: shifts[0]?.id || '',
                    weeklyOffDays: [0, 6],
                  });
                  setBulkAssignOpen(true);
                }}
                sx={{
                  bgcolor: '#14286D',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '0 2px 6px rgba(20, 40, 109, 0.25)',
                  '&:hover': { bgcolor: '#0f1e54' },
                }}
              >
                Bulk Assign Roster
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Shifts Legend & Navigation Bar */}
      <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {/* Month Navigator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setSelectedMonth((prev) => prev.subtract(1, 'month'))}
            sx={{ border: '1px solid #DDE4FF', color: '#14286D', borderRadius: '6px' }}
          >
            <HiOutlineChevronLeft size={16} />
          </IconButton>
          <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', minWidth: 150, textAlign: 'center' }}>
            {selectedMonth.format('MMMM YYYY')}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setSelectedMonth((prev) => prev.add(1, 'month'))}
            sx={{ border: '1px solid #DDE4FF', color: '#14286D', borderRadius: '6px' }}
          >
            <HiOutlineChevronRight size={16} />
          </IconButton>

          <Button
            size="small"
            variant="text"
            onClick={() => setSelectedMonth(dayjs())}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#14286D', fontSize: '12px' }}
          >
            This Month
          </Button>
        </Box>

        {/* Department Filter (Admin) */}
        {isAdmin && departments.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Department:</Typography>
            <TextField
              select
              size="small"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {/* Shifts Legend Badges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {shifts.map((s) => (
            <Tooltip key={s.id} title={`${s.name}: ${s.startTime} - ${s.endTime} (${s.graceMinutes}m grace)`}>
              <Chip
                label={`${s.code} · ${s.startTime.slice(0, 5)} - ${s.endTime.slice(0, 5)}`}
                size="small"
                sx={{
                  bgcolor: `${s.color}15`,
                  color: s.color,
                  borderColor: `${s.color}40`,
                  border: '1px solid',
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              />
            </Tooltip>
          ))}
          <Chip
            label="WO · Weekly Off"
            size="small"
            sx={{ bgcolor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '11px' }}
          />
        </Box>
      </Paper>

      {/* Roster Calendar Table */}
      <Paper sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 360px)', overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', minWidth: '100%' }}>
            <TableHead>
              <TableRow>
                {/* Sticky Employee Column */}
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#14286D',
                    bgcolor: '#F6F8FE',
                    fontSize: '12px',
                    py: 1,
                    px: 2,
                    width: 240,
                    minWidth: 240,
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    borderRight: '1.5px solid #E8ECF5',
                    borderBottom: '1.5px solid #E8ECF5',
                  }}
                >
                  EMPLOYEE & DEPT
                </TableCell>

                {/* Day Columns */}
                {daysInMonth.map((day) => (
                  <TableCell
                    key={day.dateKey}
                    align="center"
                    sx={{
                      width: 44,
                      minWidth: 44,
                      p: 0.5,
                      bgcolor: day.isToday ? '#EEF2FF' : day.isWeekend ? '#F8FAFC' : '#ffffff',
                      borderRight: '1px solid #F1F5F9',
                      borderBottom: '1.5px solid #E8ECF5',
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: day.isToday ? '#14286D' : day.isWeekend ? '#94a3b8' : '#334155',
                      }}
                    >
                      {day.dayNumber}
                    </Typography>
                    <Typography sx={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>
                      {day.weekday}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={1 + daysInMonth.length} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : displayedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={1 + daysInMonth.length} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No employees found for this department.
                  </TableCell>
                </TableRow>
              ) : (
                displayedEmployees.map((emp) => {
                  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeId;
                  const empRoster = rosterMap[emp.employeeId] || {};

                  return (
                    <TableRow key={emp.employeeId} hover>
                      {/* Sticky Employee Cell */}
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          bgcolor: '#ffffff',
                          zIndex: 2,
                          borderRight: '1.5px solid #E8ECF5',
                          py: 1,
                          px: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '11px', fontWeight: 700, bgcolor: '#14286D' }}>
                            {getInitials(fullName)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }} noWrap>
                              {fullName}
                            </Typography>
                            <Typography sx={{ fontSize: '10.5px', color: '#64748b' }} noWrap>
                              {emp.department || 'General'} · {emp.employeeId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Day Cells */}
                      {daysInMonth.map((day) => {
                        const sched = empRoster[day.dateKey];
                        const isOff = sched ? sched.isWeeklyOff : day.isWeekend;
                        const shift = sched?.shift || (isOff ? null : shifts[0]);

                        return (
                          <TableCell
                            key={day.dateKey}
                            align="center"
                            onClick={() => handleCellClick(emp, day)}
                            sx={{
                              p: 0.3,
                              borderRight: '1px solid #F1F5F9',
                              cursor: canManage ? 'pointer' : 'default',
                              bgcolor: day.isToday ? '#EEF2FF40' : 'transparent',
                              transition: 'all 0.15s ease',
                              '&:hover': canManage ? { bgcolor: '#F1F5F9' } : {},
                            }}
                          >
                            {isOff ? (
                              <Tooltip title={`Weekly Off · ${day.weekday} (${day.dateKey})`}>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 32,
                                    height: 24,
                                    borderRadius: '4px',
                                    bgcolor: '#f1f5f9',
                                    color: '#64748b',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  WO
                                </Box>
                              </Tooltip>
                            ) : shift ? (
                              <Tooltip title={`${shift.name}: ${shift.startTime} - ${shift.endTime}`}>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 32,
                                    height: 24,
                                    borderRadius: '4px',
                                    bgcolor: `${shift.color}18`,
                                    color: shift.color,
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    border: `1px solid ${shift.color}40`,
                                  }}
                                >
                                  {shift.code}
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography sx={{ fontSize: '11px', color: '#cbd5e1' }}>—</Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* DIALOG 1: Shift Master Configuration */}
      <Dialog
        open={shiftMasterOpen}
        onClose={() => setShiftMasterOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HiOutlineCog6Tooth size={22} color="#14286D" />
          Shift Master Configuration
        </DialogTitle>
        <DialogContent>
          {/* Add / Edit Form */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
              {editingShiftId ? 'Edit Shift Timing' : 'Create New Shift'}
            </Typography>
            <form onSubmit={handleShiftSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 1.5 }}>
                <TextField
                  label="Shift Name *"
                  size="small"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="e.g. General Shift"
                  required
                />
                <TextField
                  label="Shift Code *"
                  size="small"
                  value={shiftForm.code}
                  onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                  placeholder="e.g. GS"
                  required
                />
                <TextField
                  type="time"
                  label="Start Time *"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  required
                />
                <TextField
                  type="time"
                  label="End Time *"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  required
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
                <TextField
                  type="number"
                  label="Grace Period (Minutes)"
                  size="small"
                  value={shiftForm.graceMinutes}
                  onChange={(e) => setShiftForm({ ...shiftForm, graceMinutes: e.target.value })}
                />

                {/* Color Selector */}
                <Box>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', mb: 0.5, fontWeight: 600 }}>
                    Badge Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {PRESET_COLORS.map((c) => (
                      <Box
                        key={c}
                        onClick={() => setShiftForm({ ...shiftForm, color: c })}
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: c,
                          cursor: 'pointer',
                          border: shiftForm.color === c ? '2px solid #000' : '2px solid transparent',
                          transform: shiftForm.color === c ? 'scale(1.15)' : 'none',
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  {editingShiftId && (
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingShiftId(null);
                        setShiftForm({
                          name: '',
                          code: '',
                          startTime: '09:00',
                          endTime: '18:00',
                          graceMinutes: 15,
                          halfDayHours: 4.0,
                          fullDayHours: 8.0,
                          color: '#14286D',
                        });
                      }}
                      sx={{ textTransform: 'none', color: '#64748b' }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    sx={{ bgcolor: '#14286D', textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                  >
                    {editingShiftId ? 'Update Shift' : 'Add Shift'}
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>

          {/* Existing Shifts Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>CODE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>SHIFT NAME</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>TIMINGS</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>GRACE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Chip
                        label={s.code}
                        size="small"
                        sx={{ bgcolor: `${s.color}20`, color: s.color, fontWeight: 800, fontSize: '11px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</TableCell>
                    <TableCell sx={{ fontSize: '12.5px', color: '#475569' }}>
                      {s.startTime} - {s.endTime}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12.5px', color: '#475569' }}>
                      {s.graceMinutes} mins
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingShiftId(s.id);
                          setShiftForm({
                            name: s.name,
                            code: s.code,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            graceMinutes: s.graceMinutes,
                            halfDayHours: s.halfDayHours,
                            fullDayHours: s.fullDayHours,
                            color: s.color,
                          });
                        }}
                      >
                        <HiOutlinePencilSquare size={16} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteShift(s)}>
                        <HiOutlineTrash size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShiftMasterOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 2: Bulk Assign Roster */}
      <Dialog
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Bulk Roster Schedule Assignment
        </DialogTitle>
        <form onSubmit={handleBulkAssignSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Assign standard weekday shifts and weekend weekly offs for a department or team across a full date range.
            </Typography>

            <TextField
              select
              label="Target Department"
              size="small"
              value={bulkForm.department}
              onChange={(e) => setBulkForm({ ...bulkForm, department: e.target.value })}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="date"
                label="Start Date *"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={bulkForm.startDate}
                onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                required
              />
              <TextField
                type="date"
                label="End Date *"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={bulkForm.endDate}
                onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
                required
              />
            </Box>

            <TextField
              select
              label="Standard Weekday Shift *"
              size="small"
              value={bulkForm.weekdayShiftId}
              onChange={(e) => setBulkForm({ ...bulkForm, weekdayShiftId: e.target.value })}
              required
            >
              {shifts.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.code}: {s.startTime} - {s.endTime})
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#334155', mb: 1 }}>
                Designated Weekly Off Days:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {DAYS_OF_WEEK.map((d) => (
                  <FormControlLabel
                    key={d.value}
                    control={
                      <Checkbox
                        size="small"
                        checked={bulkForm.weeklyOffDays.includes(d.value)}
                        onChange={(e) => {
                          const current = bulkForm.weeklyOffDays;
                          const next = e.target.checked
                            ? [...current, d.value]
                            : current.filter((val) => val !== d.value);
                          setBulkForm({ ...bulkForm, weeklyOffDays: next });
                        }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '12.5px', fontWeight: 600 }}>{d.label}</Typography>}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkAssignOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#14286D', borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
            >
              Apply Roster
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 3: Single Date Shift Cell Edit */}
      <Dialog
        open={singleAssignOpen}
        onClose={() => setSingleAssignOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Schedule Shift: {activeCell?.day?.dateKey}
        </DialogTitle>
        <form onSubmit={handleSingleAssignSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Employee: <b>{activeCell?.employee?.firstName} {activeCell?.employee?.lastName}</b> ({activeCell?.employee?.employeeId})
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={singleForm.isWeeklyOff}
                  onChange={(e) => setSingleForm({ ...singleForm, isWeeklyOff: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontSize: '13px', fontWeight: 700 }}>Mark as Weekly Off (WO)</Typography>}
            />

            {!singleForm.isWeeklyOff && (
              <TextField
                select
                label="Assign Shift *"
                size="small"
                value={singleForm.shiftId}
                onChange={(e) => setSingleForm({ ...singleForm, shiftId: e.target.value })}
                required
              >
                {shifts.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code} · {s.startTime} - {s.endTime})
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Notes (Optional)"
              size="small"
              value={singleForm.notes}
              onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
              placeholder="e.g. Swapped with Sathish"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSingleAssignOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#14286D', borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
            >
              Save Schedule
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ShiftRosterHub;
