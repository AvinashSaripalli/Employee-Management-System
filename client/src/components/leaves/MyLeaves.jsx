import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../api/axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, CircularProgress, Box, Card, CardContent,
  TablePagination, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Stack, Grid,
} from '@mui/material';
import { formatLeaveDate, statusColor, durationLabel, LEAVE_TYPE_META, leaveIdentityParams } from '../../utils/leaveConfig';

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [tab, setTab] = useState('All');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchMyLeaves = async () => {
    try {
      const response = await axios.get('/leaves', { params: leaveIdentityParams() });
      setLeaves(response.data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const counts = useMemo(() => ({
    All: leaves.length,
    Pending: leaves.filter((row) => row.status === 'Pending').length,
    Approved: leaves.filter((row) => row.status === 'Approved').length,
    Rejected: leaves.filter((row) => row.status === 'Rejected').length,
    Cancelled: leaves.filter((row) => row.status === 'Cancelled').length,
  }), [leaves]);

  const filtered = tab === 'All' ? leaves : leaves.filter((row) => row.status === tab);
  const today = new Date().toISOString().slice(0, 10);

  const canCancel = (leave) => {
    if (leave.status === 'Pending') return true;
    if (leave.status === 'Approved' && leave.start_date > today) return true;
    return false;
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    try {
      await axios.put(`/leaves/cancel/${cancelTarget.id}`, { comment: cancelReason });
      setSnackbar({ open: true, message: 'Leave cancelled', severity: 'success' });
      setCancelTarget(null);
      setCancelReason('');
      await fetchMyLeaves();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Could not cancel this request',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, px: 2 }}>
      <Card sx={{ maxWidth: 1300, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            My leave requests
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Track approvals, reviewer comments, and cancel a request before it starts.
          </Typography>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {['Pending', 'Approved', 'Rejected', 'Cancelled'].map((key) => (
              <Grid item xs={6} sm={3} key={key}>
                <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{key}</Typography>
                  <Typography variant="h5">{counts[key]}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Tabs
            value={tab}
            onChange={(_, value) => { setTab(value); setPage(0); }}
            sx={{ mb: 2 }}
          >
            {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((key) => (
              <Tab key={key} value={key} label={`${key} (${counts[key] || 0})`} />
            ))}
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table stickyHeader sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ py: 1.5, width: 140 }}>Type</TableCell>
                      <TableCell align="left" sx={{ py: 1.5, width: 200 }}>Dates</TableCell>
                      <TableCell align="center" sx={{ py: 1.5, width: 110 }}>Duration</TableCell>
                      <TableCell align="left" sx={{ py: 1.5 }}>Reason</TableCell>
                      <TableCell align="left" sx={{ py: 1.5, width: 180 }}>Review</TableCell>
                      <TableCell align="center" sx={{ py: 1.5, width: 150 }}>Status</TableCell>
                      <TableCell align="right" sx={{ py: 1.5, width: 100 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length > 0 ? (
                      filtered
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((leave) => {
                          const meta = LEAVE_TYPE_META[leave.leave_type] || {};
                          return (
                            <TableRow key={leave.id} hover>
                              <TableCell align="center" sx={{ py: 1.25 }}>
                                <Chip
                                  size="small"
                                  label={leave.leave_type}
                                  sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '11px' }}
                                />
                              </TableCell>
                              <TableCell align="left" sx={{ py: 1.25, fontSize: '13px', fontWeight: 500, color: '#1B2A5B' }}>
                                {formatLeaveDate(leave.start_date)} – {formatLeaveDate(leave.end_date)}
                              </TableCell>
                              <TableCell align="center" sx={{ py: 1.25 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px', color: '#1B2A5B' }}>
                                  {durationLabel(leave)}
                                </Typography>
                              </TableCell>
                              <TableCell align="left" sx={{ py: 1.25, maxWidth: 240, fontSize: '13px', color: 'text.secondary' }}>
                                {leave.reason || '—'}
                              </TableCell>
                              <TableCell align="left" sx={{ py: 1.25, maxWidth: 200 }}>
                                {leave.reviewer_name || leave.review_comment ? (
                                  <Stack spacing={0.25}>
                                    {leave.reviewer_name && (
                                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '12px', color: '#1B2A5B' }}>
                                        {leave.reviewer_name}
                                      </Typography>
                                    )}
                                    {leave.review_comment && (
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                                        {leave.review_comment}
                                      </Typography>
                                    )}
                                  </Stack>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">—</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center" sx={{ py: 1.25 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Chip label={leave.status} color={statusColor(leave.status)} size="small" sx={{ fontWeight: 700, fontSize: '11px' }} />
                                  {leave.status === 'Pending' && leave.approval_stage && (
                                    <Typography display="block" variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '10.5px' }}>
                                      Waiting for {leave.approval_stage === 'FinalApprover' ? 'final approver' : leave.approval_stage.toLowerCase()}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ py: 1.25 }}>
                                {canCancel(leave) && (
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => setCancelTarget(leave)}
                                    sx={{ fontWeight: 700, px: 1.5, py: 0.3 }}
                                  >
                                    Cancel
                                  </Button>
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
                rowsPerPageOptions={[8, 15, 25]}
                component="div"
                count={filtered.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel leave request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {cancelTarget
              ? `${cancelTarget.leave_type} from ${formatLeaveDate(cancelTarget.start_date)} to ${formatLeaveDate(cancelTarget.end_date)}`
              : ''}
          </Typography>
          <TextField
            label="Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)}>Keep request</Button>
          <Button color="error" variant="contained" onClick={handleCancel} disabled={saving}>
            {saving ? 'Cancelling…' : 'Confirm cancel'}
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

export default MyLeaves;
