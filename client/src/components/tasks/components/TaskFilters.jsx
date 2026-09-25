import React, { useState } from 'react';
import { Box, Paper, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, Button, Chip, Stack, IconButton, Tooltip, Grid, Collapse, Typography, Divider, FormControlLabel } from '@mui/material';
import { FiSearch, FiFilter, FiDownload, FiTrash2, FiCheckCircle, FiX, FiCalendar, FiFlag } from 'react-icons/fi';
import { STATUS_META, PRIORITY_META } from '../utils/taskConstants';

export default function TaskFilters({
  search, setSearch,
  filter, setFilter,
  myTasksOnly, setMyTasksOnly,
  priorityFilter, setPriorityFilter,
  deadlineFrom, setDeadlineFrom,
  deadlineTo, setDeadlineTo,
  selectedIds, onBulkAction, onExport, tasksCount,
  // Role-based props
  isAdmin = false,
  isSupervisor = false,
  isEmployee = false,
  currentUserDept = '',
  departmentFilter = 'all',
  setDepartmentFilter,
  departments = [],
  employeeFilter = 'all',
  setEmployeeFilter,
  users = [],
  supervisorScope = 'dept',
  setSupervisorScope,
  empScope = 'all',
  setEmpScope,
}) {
  const [advanced, setAdvanced] = useState(false);
  const activeFilters = [
    filter !== 'all',
    priorityFilter !== 'all',
    !!deadlineFrom,
    !!deadlineTo,
    myTasksOnly,
    departmentFilter !== 'all',
    employeeFilter !== 'all',
    empScope !== 'all',
  ].filter(Boolean).length;

  const assignableUsers = isSupervisor && currentUserDept
    ? users.filter(u => u.department === currentUserDept)
    : users;

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #E8EEF9', bgcolor: '#fff', boxShadow: '0 2px 12px rgba(20,40,109,0.04)' }}>
      {/* Top Scope / Role Status Bar */}
      {(isSupervisor || isEmployee) && (
        <Box sx={{ mb: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, pb: 1.5, borderBottom: '1px dashed #E2E8F0' }}>
          {isSupervisor && setSupervisorScope && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Supervisor Scope:
              </Typography>
              <Box sx={{ display: 'inline-flex', bgcolor: '#F1F5F9', p: 0.3, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Button
                  size="small"
                  onClick={() => setSupervisorScope('dept')}
                  sx={{
                    px: 1.5,
                    py: 0.35,
                    borderRadius: 1.5,
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: supervisorScope === 'dept' ? '#14286D' : 'transparent',
                    color: supervisorScope === 'dept' ? '#FFFFFF' : '#475569',
                    boxShadow: supervisorScope === 'dept' ? '0 1px 3px rgba(20, 40, 109, 0.2)' : 'none',
                    '&:hover': { bgcolor: supervisorScope === 'dept' ? '#0E1D50' : '#E2E8F0' },
                  }}
                >
                  All {currentUserDept} Tasks
                </Button>
                <Button
                  size="small"
                  onClick={() => setSupervisorScope('my')}
                  sx={{
                    px: 1.5,
                    py: 0.35,
                    borderRadius: 1.5,
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: supervisorScope === 'my' ? '#14286D' : 'transparent',
                    color: supervisorScope === 'my' ? '#FFFFFF' : '#475569',
                    boxShadow: supervisorScope === 'my' ? '0 1px 3px rgba(20, 40, 109, 0.2)' : 'none',
                    '&:hover': { bgcolor: supervisorScope === 'my' ? '#0E1D50' : '#E2E8F0' },
                  }}
                >
                  My Tasks Only
                </Button>
              </Box>
            </Box>
          )}

          {isEmployee && setEmpScope && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Task Filter:
              </Typography>
              <Chip
                size="small"
                label="All My Tasks"
                onClick={() => setEmpScope('all')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  bgcolor: empScope === 'all' ? '#14286D' : '#F1F5F9',
                  color: empScope === 'all' ? '#FFFFFF' : '#475569',
                  border: '1px solid',
                  borderColor: empScope === 'all' ? '#14286D' : '#CBD5E1',
                }}
              />
              <Chip
                size="small"
                label="Assigned to Me"
                onClick={() => setEmpScope('assigned')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  bgcolor: empScope === 'assigned' ? '#14286D' : '#F1F5F9',
                  color: empScope === 'assigned' ? '#FFFFFF' : '#475569',
                  border: '1px solid',
                  borderColor: empScope === 'assigned' ? '#14286D' : '#CBD5E1',
                }}
              />
              <Chip
                size="small"
                label="Created by Me"
                onClick={() => setEmpScope('created')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  bgcolor: empScope === 'created' ? '#14286D' : '#F1F5F9',
                  color: empScope === 'created' ? '#FFFFFF' : '#475569',
                  border: '1px solid',
                  borderColor: empScope === 'created' ? '#14286D' : '#CBD5E1',
                }}
              />
              <Chip
                size="small"
                label="Observing"
                onClick={() => setEmpScope('observing')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  bgcolor: empScope === 'observing' ? '#14286D' : '#F1F5F9',
                  color: empScope === 'observing' ? '#FFFFFF' : '#475569',
                  border: '1px solid',
                  borderColor: empScope === 'observing' ? '#14286D' : '#CBD5E1',
                }}
              />
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search title, assignee, id, description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#F8FAFD', '& fieldset': { borderColor: '#E8EEF9' }, '&:hover fieldset': { borderColor: '#CBD5E1' } } }}
          InputProps={{ startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748B' }} size={16} /> }}
        />

        {/* Admin Department Filter */}
        {isAdmin && setDepartmentFilter && (
          <FormControl size="small" sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              sx={{ bgcolor: '#fff' }}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {departments.map(d => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Admin & Supervisor Assignee Filter */}
        {(isAdmin || (isSupervisor && supervisorScope !== 'my')) && setEmployeeFilter && (
          <FormControl size="small" sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
            <InputLabel>Employee</InputLabel>
            <Select
              label="Employee"
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              sx={{ bgcolor: '#fff' }}
            >
              <MenuItem value="all">{isSupervisor ? `All ${currentUserDept} Members` : 'All Employees'}</MenuItem>
              {assignableUsers.map(u => (
                <MenuItem key={u.employeeId || u.id} value={u.employeeId || String(u.id)}>
                  {u.firstName} {u.lastName} ({u.employeeId})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filter} onChange={e => setFilter(e.target.value)} sx={{ bgcolor: '#fff' }}>
            <MenuItem value="all">All statuses</MenuItem>
            {Object.entries(STATUS_META).map(([v, m]) => (
              <MenuItem key={v} value={v}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.dot }} />{m.label}</Box></MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 125, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Priority</InputLabel>
          <Select label="Priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} sx={{ bgcolor: '#fff' }}>
            <MenuItem value="all">All priorities</MenuItem>
            {Object.entries(PRIORITY_META).map(([v, m]) => (
              <MenuItem key={v} value={v}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FiFlag size={12} color={m.color === 'error' ? '#DC2626' : m.color === 'info' ? '#0284C7' : '#64748B'} />{m.label}</Box></MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Only show "My tasks only" for Admin (Supervisors and Employees have specialized toggles above) */}
        {isAdmin && (
          <FormControlLabel
            control={<Checkbox size="small" checked={myTasksOnly} onChange={e => setMyTasksOnly(e.target.checked)} sx={{ '&.Mui-checked': { color: '#14286D' } }} />}
            label={<Typography variant="caption" fontWeight={600}>My tasks only</Typography>}
            sx={{ m: 0, px: 1, py: 0.3, borderRadius: 2, bgcolor: myTasksOnly ? '#EEF2FF' : '#F8FAFD', border: '1px solid', borderColor: myTasksOnly ? '#C7D2FE' : '#E8EEF9' }}
          />
        )}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title={advanced ? 'Hide advanced' : 'Advanced filters'}>
          <IconButton size="small" onClick={() => setAdvanced(v => !v)} sx={{ bgcolor: advanced ? '#14286D' : '#F1F5F9', color: advanced ? '#fff' : '#475569', '&:hover': { bgcolor: advanced ? '#1E3A8A' : '#E2E8F0' } }}>
            <FiFilter size={15} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export CSV">
          <IconButton size="small" onClick={onExport} sx={{ bgcolor: '#F1F5F9', color: '#475569' }}><FiDownload size={15} /></IconButton>
        </Tooltip>
        <Chip size="small" label={`${tasksCount} tasks`} sx={{ bgcolor: '#14286D', color: '#fff', fontWeight: 700, height: 26, px: 0.5 }} />
        {activeFilters > 0 && <Chip size="small" label={`${activeFilters} filters`} color="warning" variant="outlined" sx={{ height: 22, fontSize: 11 }} />}
      </Box>

      <Collapse in={advanced}>
        <Box sx={{ mt: 1.8, p: 1.6, bgcolor: '#F8FAFD', borderRadius: 2.5, border: '1px dashed #CBD5E1', display: 'flex', gap: 1.2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField type="date" label="From" size="small" InputLabelProps={{ shrink: true }} value={deadlineFrom} onChange={e => setDeadlineFrom(e.target.value)} sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }} />
          <TextField type="date" label="To" size="small" InputLabelProps={{ shrink: true }} value={deadlineTo} onChange={e => setDeadlineTo(e.target.value)} sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5 }}>
            <FiCalendar size={14} color="#64748B" />
            <Typography variant="caption" color="text.secondary">Deadline range</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="text" startIcon={<FiX size={13} />} onClick={() => { setDeadlineFrom(''); setDeadlineTo(''); setPriorityFilter('all'); setFilter('all'); setMyTasksOnly(false); }} sx={{ textTransform: 'none' }}>Clear all</Button>
        </Box>
      </Collapse>

      {selectedIds.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 1.8, p: 1, bgcolor: '#FFFBEB', borderColor: '#FDE68A', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', borderRadius: 2.5 }}>
          <Chip icon={<FiCheckCircle size={12} />} label={`${selectedIds.length} selected`} size="small" sx={{ bgcolor: '#FEF3C2', fontWeight: 700, height: 22 }} />
          <Button size="small" variant="contained" onClick={() => onBulkAction('complete')} sx={{ bgcolor: '#16A34A', textTransform: 'none', borderRadius: 2, height: 28 }}>Complete</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => onBulkAction('delete')} startIcon={<FiTrash2 size={13} />} sx={{ textTransform: 'none', borderRadius: 2, height: 28 }}>Delete</Button>
          <Button size="small" onClick={() => onBulkAction('clear')} sx={{ textTransform: 'none' }}>Clear</Button>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>Bulk actions apply to selected rows</Typography>
        </Paper>
      )}
    </Paper>
  );
}
