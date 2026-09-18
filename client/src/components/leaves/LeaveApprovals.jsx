import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Chip, TablePagination, Grid, Card, CardContent, TextField, MenuItem,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
  Stack, Avatar, InputAdornment, Divider,
} from '@mui/material';
import axios from '../../api/axios';
import dayjs from 'dayjs';
import { SearchNormal1 } from 'iconsax-react';
import { durationLabel, formatLeaveDate, LEAVE_TYPE_META, statusColor, leaveIdentityParams } from '../../utils/leaveConfig';

const employeeName = (leave) =>
  leave.employee_name ||
  `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim() ||
  leave.employeeId;

const LeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [counts, setCounts] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0, onLeaveToday: 0 });
  const [todayList, setTodayList] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [leaveType, setLeaveType] = useState('All');
  const [review, setReview] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [policies, setPolicies] = useState({ types: {} });

  const fetchLeaves = useCallback(async () => {
    const identity = leaveIdentityParams();
    try {
      const [listRes, countRes, todayRes, policyRes] = await Promise.allSettled([
        axios.get('/leaves/leave', {
          params: {
            ...identity,
            status: tab === 'All' || tab === 'Today' ? 'All' : tab,
            leaveType,
            search,
          },
        }),
        axios.get('/leaves/leave-counts', { params: identity }),
        axios.get('/leaves/approved-leaves-today', { params: identity }),
        axios.get('/leaves/policies'),
      ]);
      if (listRes.status === 'fulfilled') setLeaves(listRes.value.data || []);
      if (countRes.status === 'fulfilled') setCounts(countRes.value.data || {});
      if (todayRes.status === 'fulfilled') setTodayList(todayRes.value.data?.employees || []);
      if (policyRes.status === 'fulfilled') setPolicies(policyRes.value.data || { types: {} });
      const failed = [listRes, countRes, todayRes].find((result) => result.status === 'rejected');
      if (failed) console.error('Error fetching leave data:', failed.reason);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
  }, [tab, leaveType, search]);

  useEffect(() => {
    const timer = setTimeout(fetchLeaves, 200);
    return () => clearTimeout(timer);
  }, [fetchLeaves]);

  const visibleLeaves = useMemo(() => {
    if (tab !== 'Today') return leaves;
    const today = dayjs().format('YYYY-MM-DD');
    return leaves.filter(
      (leave) => leave.status === 'Approved' && leave.start_date <= today && leave.end_date >= today
    );
  }, [leaves, tab]);

  const openReview = (leave, action) => {
    setReview({ leave, action });
    setComment('');
  };

  const submitReview = async () => {
    if (!review) return;
    if (review.action === 'Rejected' && comment.trim().length < 4) {
      setSnackbar({ open: true, message: 'Please add a short rejection reason', severity: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await axios.put('/leaves/update-status', {
        leaveId: review.leave.id,
        status: review.action,
        comment,
      });
      setSnackbar({
        open: true,
        message: `Leave ${review.action.toLowerCase()}`,
        severity: review.action === 'Approved' ? 'success' : 'info',
      });
      setReview(null);
      await fetchLeaves();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Could not update leave status',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = ['All', ...Object.keys(policies.types || {})];

  return (
    <Box sx={{ display: 'flex', gap: 3, p: { xs: 2, md: 3 }, flexDirection: { xs: 'column', lg: 'row' } }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5">Leave approvals</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>
            Review overlapping dates, remaining quota impact, and record a decision with comments
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search name, ID, department or reason"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={16} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Type"
            value={leaveType}
            onChange={(e) => { setLeaveType(e.target.value); setPage(0); }}
            sx={{ minWidth: 180 }}
          >
            {typeOptions.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
        </Stack>

        <Tabs value={tab} onChange={(_, value) => { setTab(value); setPage(0); }} sx={{ mb: 2 }}>
          <Tab value="Pending" label={`Pending (${counts.pending || 0})`} />
          <Tab value="Approved" label={`Approved (${counts.approved || 0})`} />
          <Tab value="Rejected" label={`Rejected (${counts.rejected || 0})`} />
          <Tab value="Today" label={`On leave today (${counts.onLeaveToday || 0})`} />
          <Tab value="All" label={`All (${counts.total || 0})`} />
        </Tabs>

        <TableContainer component={Paper} sx={{ maxHeight: 560, borderRadius: 3 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Decision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleLeaves.length > 0 ? (
                visibleLeaves
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((leave) => {
                    const meta = LEAVE_TYPE_META[leave.leave_type] || {};
                    const name = employeeName(leave);
                    return (
                      <TableRow key={leave.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Avatar src={leave.employee?.photo || undefined} sx={{ width: 32, height: 32 }}>
                              {name.slice(0, 1)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {leave.employeeId}
                                {leave.department || leave.employee?.department
                                  ? ` · ${leave.department || leave.employee?.department}`
                                  : ''}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={leave.leave_type} sx={{ bgcolor: meta.bg, color: meta.color }} />
                        </TableCell>
                        <TableCell>
                          {formatLeaveDate(leave.start_date)} – {formatLeaveDate(leave.end_date)}
                        </TableCell>
                        <TableCell>{durationLabel(leave)}</TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" noWrap title={leave.reason}>{leave.reason}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={leave.status} color={statusColor(leave.status)} />
                        </TableCell>
                        <TableCell align="right">
                          {leave.status === 'Pending' ? (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" variant="contained" color="success" onClick={() => openReview(leave, 'Approved')}>
                                Approve
                              </Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => openReview(leave, 'Rejected')}>
                                Reject
                              </Button>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {leave.reviewer_name || '—'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No leave records in this view
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={visibleLeaves.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(+event.target.value);
            setPage(0);
          }}
          rowsPerPageOptions={[8, 15, 25]}
        />
      </Box>

      <Box sx={{ width: { xs: '100%', lg: 320 } }}>
        <Grid container spacing={2}>
          {[
            { label: 'Total', value: counts.total, color: '#14286D' },
            { label: 'Approved', value: counts.approved, color: '#16A34A' },
            { label: 'Pending', value: counts.pending, color: '#F59E0B' },
            { label: 'Rejected', value: counts.rejected, color: '#E11D48' },
          ].map((card) => (
            <Grid item xs={6} key={card.label}>
              <Card sx={{ borderTop: `4px solid ${card.color}`, textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                  <Typography variant="h4">{card.value || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>On leave today</Typography>
            {todayList.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Nobody is on approved leave today.</Typography>
            ) : (
              todayList.map((person, index) => (
                <Box key={person.id}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{person.name || person.employeeId}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {person.leave_type}
                    {person.half_day ? ` · Half day ${person.half_day_session || ''}` : ''}
                  </Typography>
                  {index < todayList.length - 1 && <Divider sx={{ my: 1 }} />}
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={!!review} onClose={() => setReview(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {review?.action === 'Approved' ? 'Approve leave' : 'Reject leave'}
        </DialogTitle>
        <DialogContent>
          {review?.leave && (
            <Stack spacing={1} sx={{ mb: 2, mt: 0.5 }}>
              <Typography variant="body2">
                <strong>{employeeName(review.leave)}</strong> · {review.leave.leave_type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatLeaveDate(review.leave.start_date)} – {formatLeaveDate(review.leave.end_date)} · {durationLabel(review.leave)}
              </Typography>
              <Typography variant="body2">{review.leave.reason}</Typography>
            </Stack>
          )}
          <TextField
            label={review?.action === 'Rejected' ? 'Rejection reason (required)' : 'Comment (optional)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReview(null)}>Back</Button>
          <Button
            variant="contained"
            color={review?.action === 'Rejected' ? 'error' : 'success'}
            onClick={submitReview}
            disabled={saving}
          >
            {saving ? 'Saving…' : `Confirm ${review?.action?.toLowerCase() || ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveApprovals;
