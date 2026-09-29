import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineBuildingOffice2,
  HiOutlineCpuChip,
  HiOutlineBanknotes,
  HiOutlineClipboardDocumentCheck,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineDocumentCheck,
} from 'react-icons/hi2';
import axios from '../../api/axios';

const REASON_CATEGORIES = [
  'Better Career Opportunity',
  'Higher Studies / Education',
  'Relocation / Family Reasons',
  'Health / Personal Reasons',
  'Compensation & Benefits',
  'Change in Career Path',
  'Other',
];

const OffboardingHub = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resignations, setResignations] = useState([]);
  const [myResignation, setMyResignation] = useState(null);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pendingApproval: 0,
    clearanceInProgress: 0,
    completed: 0,
  });

  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredResignations = React.useMemo(() => {
    if (statusFilter === 'ALL') return resignations;
    if (statusFilter === 'PENDING') return resignations.filter((r) => ['Submitted', 'Under Review'].includes(r.status));
    if (statusFilter === 'CLEARANCE') return resignations.filter((r) => ['Approved', 'Clearance in Progress'].includes(r.status));
    if (statusFilter === 'COMPLETED') return resignations.filter((r) => r.status === 'Completed');
    return resignations;
  }, [resignations, statusFilter]);

  // Dialogs
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [managerReviewDialogOpen, setManagerReviewDialogOpen] = useState(false);
  const [hrReviewDialogOpen, setHrReviewDialogOpen] = useState(false);
  const [clearanceDialogOpen, setClearanceDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Forms
  const [submitForm, setSubmitForm] = useState({
    resignationDate: new Date().toISOString().split('T')[0],
    requestedLastWorkingDay: '',
    reason: 'Better Career Opportunity',
    detailedReason: '',
    personalEmail: '',
    contactNumber: '',
  });

  const [reviewForm, setReviewForm] = useState({
    decision: 'Approved',
    approvedLastWorkingDay: '',
    comments: '',
  });

  const [clearanceForm, setClearanceForm] = useState({
    itClearance: 'Pending',
    itClearanceNotes: '',
    financeClearance: 'Pending',
    financeClearanceNotes: '',
    adminClearance: 'Pending',
    adminClearanceNotes: '',
    exitInterviewDone: false,
    exitInterviewFeedback: '',
    relievingLetterIssued: false,
  });

  const userRole = localStorage.getItem('userRole') || 'Employee';
  const deptRole = localStorage.getItem('departmentRole') || 'Member';
  const isPrivileged = ['Admin', 'Manager'].includes(userRole) || deptRole === 'Supervisor';
  const currentEmpId = localStorage.getItem('userEmployeeId');

  // Calculate default 30 days notice
  useEffect(() => {
    const today = new Date();
    const future30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dateStr = future30.toISOString().split('T')[0];
    setSubmitForm((prev) => ({
      ...prev,
      requestedLastWorkingDay: dateStr,
      personalEmail: localStorage.getItem('userEmail') || '',
    }));
  }, []);

  const fetchResignations = async () => {
    if (!isPrivileged) return;
    setLoading(true);
    try {
      const res = await axios.get('/resignations', {
        params: { status: statusFilter !== 'ALL' ? statusFilter : undefined },
      });
      setResignations(res.data?.resignations || []);
      if (res.data?.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Error fetching resignations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResignation = async () => {
    if (!currentEmpId) return;
    try {
      const res = await axios.get('/resignations/my-resignation');
      setMyResignation(res.data?.resignation || null);
      setAssignedAssets(res.data?.assignedAssets || []);
    } catch (err) {
      console.error('Error fetching personal resignation:', err);
    }
  };

  useEffect(() => {
    fetchResignations();
    fetchMyResignation();
  }, [statusFilter]);

  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!submitForm.requestedLastWorkingDay) {
      alert('Requested Last Working Day is required.');
      return;
    }
    const finalReason = submitForm.detailedReason
      ? `${submitForm.reason} - ${submitForm.detailedReason}`
      : submitForm.reason;

    try {
      await axios.post('/resignations/submit', {
        ...submitForm,
        reason: finalReason,
      });
      alert('Resignation submitted successfully.');
      setSubmitDialogOpen(false);
      fetchMyResignation();
      fetchResignations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit resignation.');
    }
  };

  const handleWithdrawResignation = async () => {
    if (!myResignation) return;
    if (!window.confirm('Are you sure you want to withdraw your resignation?')) return;
    try {
      await axios.post(`/resignations/${myResignation.id}/withdraw`);
      alert('Resignation withdrawn.');
      fetchMyResignation();
      fetchResignations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to withdraw resignation.');
    }
  };

  const handleManagerReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await axios.post(`/resignations/${selectedRecord.id}/manager-review`, reviewForm);
      alert(`Resignation marked as ${reviewForm.decision} by Manager.`);
      setManagerReviewDialogOpen(false);
      setSelectedRecord(null);
      fetchResignations();
      fetchMyResignation();
      window.dispatchEvent(new CustomEvent('requestCountsUpdated'));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process manager review.');
    }
  };

  const handleHrReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await axios.post(`/resignations/${selectedRecord.id}/hr-review`, reviewForm);
      alert(`Resignation marked as ${reviewForm.decision} by HR.`);
      setHrReviewDialogOpen(false);
      setSelectedRecord(null);
      fetchResignations();
      fetchMyResignation();
      window.dispatchEvent(new CustomEvent('requestCountsUpdated'));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process HR review.');
    }
  };

  const handleSaveClearanceItem = async (clearanceType, status, notes, extra) => {
    if (!selectedRecord) return;
    try {
      const payload = {
        clearanceType,
        status,
        notes,
        ...(extra || {}),
      };
      const res = await axios.post(`/resignations/${selectedRecord.id}/clearance`, payload);
      setSelectedRecord(res.data.resignation);
      fetchResignations();
      fetchMyResignation();
      window.dispatchEvent(new CustomEvent('requestCountsUpdated'));
      alert(`Clearance updated for ${clearanceType.toUpperCase()}.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update clearance.');
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Submitted':
        return <Chip label="Submitted" size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }} />;
      case 'Under Review':
        return <Chip label="Under Review" size="small" sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700 }} />;
      case 'Approved':
      case 'Clearance in Progress':
        return <Chip label="Clearance in Progress" size="small" sx={{ bgcolor: '#f5f3ff', color: '#6d28d9', fontWeight: 700 }} />;
      case 'Completed':
        return <Chip label="Completed / Relieved" size="small" sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 700 }} />;
      case 'Rejected':
        return <Chip label="Rejected" size="small" sx={{ bgcolor: '#fef2f2', color: '#b91c1c', fontWeight: 700 }} />;
      case 'Withdrawn':
        return <Chip label="Withdrawn" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getActiveStep = (status) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Review':
        return 1;
      case 'Clearance in Progress':
        return 2;
      case 'Completed':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Banner */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HiOutlineArrowRightOnRectangle size={26} color="#14286D" />
            Resignation & Offboarding Hub
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.25 }}>
            Automated exit lifecycle, supervisor endorsements, IT hardware return, and multi-department clearances
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {!myResignation && (
            <Button
              variant="contained"
              startIcon={<HiOutlinePlus size={18} />}
              onClick={() => setSubmitDialogOpen(true)}
              sx={{
                bgcolor: '#14286D',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
                '&:hover': { bgcolor: '#0f1e54' },
              }}
            >
              Submit Resignation
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(e, val) => setTabValue(val)}
        sx={{
          mb: 2.5,
          borderBottom: '1px solid #e2e8f0',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '14px', minWidth: 140 },
          '& .Mui-selected': { color: '#14286D' },
          '& .MuiTabs-indicator': { bgcolor: '#14286D', height: 3 },
        }}
      >
        <Tab label="My Resignation & Clearance" />
        {isPrivileged && (
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Offboarding Queue</span>
                {metrics.pendingApproval > 0 ? (
                  <Chip
                    label={metrics.pendingApproval}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      px: 0.6,
                      fontSize: '11px',
                      fontWeight: 800,
                      bgcolor: tabValue === 1 ? '#14286D' : '#EF4444',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                    }}
                  />
                ) : (
                  <Chip
                    label={resignations.length}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      px: 0.6,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: '#F1F5F9',
                      color: '#475569',
                      borderRadius: '10px',
                    }}
                  />
                )}
              </Box>
            }
          />
        )}
      </Tabs>

      {/* TAB 0: Employee Self-Service */}
      {tabValue === 0 && (
        <Box>
          {!myResignation ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
              <HiOutlineDocumentCheck size={52} color="#94a3b8" style={{ marginBottom: 12 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                No Active Resignation
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 480, mx: 'auto', mt: 0.5, mb: 2.5 }}>
                You are currently in active standing. If you plan to move on, you can submit your formal resignation notice here to trigger the automated clearance process.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<HiOutlineArrowRightOnRectangle size={18} />}
                onClick={() => setSubmitDialogOpen(true)}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: '#14286D',
                  color: '#14286D',
                  '&:hover': { bgcolor: '#EEF2FF' },
                }}
              >
                Initiate Resignation Notice
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Status Tracker Card */}
              <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        Resignation Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        {getStatusChip(myResignation.status)}
                        <Typography sx={{ fontSize: '14px', color: '#475569' }}>
                          Notice Period: <b>{myResignation.noticePeriodDays} days</b>
                        </Typography>
                      </Box>
                    </Box>

                    {['Submitted', 'Under Review'].includes(myResignation.status) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={handleWithdrawResignation}
                        sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
                      >
                        Withdraw Resignation
                      </Button>
                    )}
                  </Box>

                  {/* Stepper */}
                  <Stepper activeStep={getActiveStep(myResignation.status)} alternativeLabel sx={{ mb: 3 }}>
                    <Step>
                      <StepLabel>Submitted ({myResignation.resignationDate})</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>
                        Manager Review ({myResignation.managerApprovalStatus})
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>
                        HR Clearance & Approvals ({myResignation.hrApprovalStatus})
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Relieved / Final Settlement</StepLabel>
                    </Step>
                  </Stepper>

                  {/* Key Dates Banner */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, bgcolor: '#f8fafc', p: 2, borderRadius: '12px' }}>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Submission Date</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {myResignation.resignationDate}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Requested Last Day</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {myResignation.requestedLastWorkingDay}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Approved Last Day</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#14286D' }}>
                        {myResignation.approvedLastWorkingDay || 'Under Approval'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Clearance Checklist Grid */}
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Multi-Department Exit Clearance Status
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                {/* 1. IT Clearance */}
                <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#EEF2FF', color: '#14286D' }}>
                        <HiOutlineCpuChip size={20} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        IT & Device Return
                      </Typography>
                    </Box>
                    <Chip
                      label={myResignation.itClearance}
                      size="small"
                      sx={{
                        bgcolor: myResignation.itClearance === 'Cleared' ? '#ecfdf5' : '#fffbeb',
                        color: myResignation.itClearance === 'Cleared' ? '#047857' : '#b45309',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', mb: 1.5 }}>
                    Hardware return and company account revocation
                  </Typography>

                  {assignedAssets.length > 0 ? (
                    <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '10px' }}>
                      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#475569', mb: 0.5 }}>
                        Pending Return Devices ({assignedAssets.length}):
                      </Typography>
                      {assignedAssets.map((a) => (
                        <Typography key={a.id} sx={{ fontSize: '11.5px', color: '#0f172a' }}>
                          • {a.name} ({a.assetTag})
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '11.5px', color: '#059669', fontStyle: 'italic' }}>
                      ✓ All company devices returned / None assigned
                    </Typography>
                  )}
                  {myResignation.itClearanceNotes && (
                    <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 1 }}>
                      Notes: {myResignation.itClearanceNotes}
                    </Typography>
                  )}
                </Card>

                {/* 2. Finance Clearance */}
                <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#ecfdf5', color: '#059669' }}>
                        <HiOutlineBanknotes size={20} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        Finance & Payroll
                      </Typography>
                    </Box>
                    <Chip
                      label={myResignation.financeClearance}
                      size="small"
                      sx={{
                        bgcolor: myResignation.financeClearance === 'Cleared' ? '#ecfdf5' : '#fffbeb',
                        color: myResignation.financeClearance === 'Cleared' ? '#047857' : '#b45309',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', mb: 1.5 }}>
                    Full & final settlement, travel dues, and tax clearance
                  </Typography>
                  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '10px' }}>
                    <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
                      Settlement process initiated automatically on approved last working day.
                    </Typography>
                  </Box>
                  {myResignation.financeClearanceNotes && (
                    <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 1 }}>
                      Notes: {myResignation.financeClearanceNotes}
                    </Typography>
                  )}
                </Card>

                {/* 3. Admin / Operations Clearance */}
                <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#f5f3ff', color: '#7c3aed' }}>
                        <HiOutlineBuildingOffice2 size={20} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        Admin & Facilities
                      </Typography>
                    </Box>
                    <Chip
                      label={myResignation.adminClearance}
                      size="small"
                      sx={{
                        bgcolor: myResignation.adminClearance === 'Cleared' ? '#ecfdf5' : '#fffbeb',
                        color: myResignation.adminClearance === 'Cleared' ? '#047857' : '#b45309',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', mb: 1.5 }}>
                    Access badge handover, locker keys, and vehicle pass
                  </Typography>
                  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '10px' }}>
                    <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
                      Please hand over physical ID card and access badges to the HR desk.
                    </Typography>
                  </Box>
                  {myResignation.adminClearanceNotes && (
                    <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 1 }}>
                      Notes: {myResignation.adminClearanceNotes}
                    </Typography>
                  )}
                </Card>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: Privileged Queue (Admin/Manager/HR) */}
      {tabValue === 1 && isPrivileged && (
        <Box>
          {/* Metrics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 2 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Resignations</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>{metrics.total}</Typography>
            </Card>
            <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 2 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Pending Approvals</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#b45309', mt: 0.5 }}>{metrics.pendingApproval}</Typography>
            </Card>
            <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 2 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Clearance In Progress</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6d28d9', mt: 0.5 }}>{metrics.clearanceInProgress}</Typography>
            </Card>
            <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 2 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Completed / Relieved</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#047857', mt: 0.5 }}>{metrics.completed}</Typography>
            </Card>
          </Box>

          {/* Status Filter Pills with Counts */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: `All (${metrics.total})` },
              { key: 'PENDING', label: `Pending Approval (${metrics.pendingApproval})` },
              { key: 'CLEARANCE', label: `Clearance In Progress (${metrics.clearanceInProgress})` },
              { key: 'COMPLETED', label: `Completed (${metrics.completed})` },
            ].map((pill) => {
              const active = statusFilter === pill.key;
              return (
                <Button
                  key={pill.key}
                  size="small"
                  onClick={() => setStatusFilter(pill.key)}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    px: 1.6,
                    py: 0.4,
                    bgcolor: active ? '#14286D' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: active ? '#14286D' : '#CBD5E1',
                    boxShadow: active ? '0 1px 3px rgba(20, 40, 109, 0.2)' : 'none',
                    '&:hover': {
                      bgcolor: active ? '#0F1F58' : '#F1F5F9',
                    },
                  }}
                >
                  {pill.label}
                </Button>
              );
            })}
          </Box>

          {/* Table */}
          <Paper sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>EMPLOYEE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>NOTICE / LAST DAY</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>MANAGER</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>HR</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>CLEARANCES</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : filteredResignations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                        No resignation records found in this view.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResignations.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                            {r.employeeName}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                            {r.department} • ID: {r.employeeId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                            {r.approvedLastWorkingDay || r.requestedLastWorkingDay}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                            Notice: {r.noticePeriodDays} days
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(r.status)}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.managerApprovalStatus}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: r.managerApprovalStatus === 'Approved' ? '#a7f3d0' : '#fed7aa',
                              color: r.managerApprovalStatus === 'Approved' ? '#047857' : '#9a3412',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.hrApprovalStatus}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: r.hrApprovalStatus === 'Approved' ? '#a7f3d0' : '#fed7aa',
                              color: r.hrApprovalStatus === 'Approved' ? '#047857' : '#9a3412',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title={`IT Clearance: ${r.itClearance}`}>
                              <Chip
                                label="IT"
                                size="small"
                                sx={{
                                  bgcolor: r.itClearance === 'Cleared' ? '#ecfdf5' : '#f1f5f9',
                                  color: r.itClearance === 'Cleared' ? '#047857' : '#64748b',
                                  fontWeight: 700,
                                  fontSize: '10px',
                                }}
                              />
                            </Tooltip>
                            <Tooltip title={`Finance Clearance: ${r.financeClearance}`}>
                              <Chip
                                label="FIN"
                                size="small"
                                sx={{
                                  bgcolor: r.financeClearance === 'Cleared' ? '#ecfdf5' : '#f1f5f9',
                                  color: r.financeClearance === 'Cleared' ? '#047857' : '#64748b',
                                  fontWeight: 700,
                                  fontSize: '10px',
                                }}
                              />
                            </Tooltip>
                            <Tooltip title={`Admin Clearance: ${r.adminClearance}`}>
                              <Chip
                                label="ADM"
                                size="small"
                                sx={{
                                  bgcolor: r.adminClearance === 'Cleared' ? '#ecfdf5' : '#f1f5f9',
                                  color: r.adminClearance === 'Cleared' ? '#047857' : '#64748b',
                                  fontWeight: 700,
                                  fontSize: '10px',
                                }}
                              />
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {r.managerApprovalStatus === 'Pending' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setReviewForm({
                                    decision: 'Approved',
                                    approvedLastWorkingDay: r.requestedLastWorkingDay,
                                    comments: '',
                                  });
                                  setManagerReviewDialogOpen(true);
                                }}
                                sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700 }}
                              >
                                Manager Review
                              </Button>
                            )}

                            {r.managerApprovalStatus === 'Approved' && r.hrApprovalStatus === 'Pending' && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setReviewForm({
                                    decision: 'Approved',
                                    approvedLastWorkingDay: r.approvedLastWorkingDay || r.requestedLastWorkingDay,
                                    comments: '',
                                  });
                                  setHrReviewDialogOpen(true);
                                }}
                                sx={{ bgcolor: '#14286D', textTransform: 'none', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, '&:hover': { bgcolor: '#0f1e54' } }}
                              >
                                HR Review
                              </Button>
                            )}

                            {r.hrApprovalStatus === 'Approved' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setClearanceForm({
                                    itClearance: r.itClearance || 'Pending',
                                    itClearanceNotes: r.itClearanceNotes || '',
                                    financeClearance: r.financeClearance || 'Pending',
                                    financeClearanceNotes: r.financeClearanceNotes || '',
                                    adminClearance: r.adminClearance || 'Pending',
                                    adminClearanceNotes: r.adminClearanceNotes || '',
                                    exitInterviewDone: !!r.exitInterviewDone,
                                    exitInterviewFeedback: r.exitInterviewFeedback || '',
                                    relievingLetterIssued: !!r.relievingLetterIssued,
                                  });
                                  setClearanceDialogOpen(true);
                                }}
                                sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700 }}
                              >
                                Clearances
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* DIALOG 1: Submit Resignation */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Submit Resignation Notice
        </DialogTitle>
        <form onSubmit={handleSubmitResignation}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Your resignation notice will be formally dispatched to your reporting manager and HR.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="date"
                label="Resignation Date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={submitForm.resignationDate}
                onChange={(e) => setSubmitForm({ ...submitForm, resignationDate: e.target.value })}
                required
              />
              <TextField
                type="date"
                label="Requested Last Working Day *"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={submitForm.requestedLastWorkingDay}
                onChange={(e) => setSubmitForm({ ...submitForm, requestedLastWorkingDay: e.target.value })}
                required
              />
            </Box>

            <TextField
              select
              label="Primary Reason *"
              size="small"
              value={submitForm.reason}
              onChange={(e) => setSubmitForm({ ...submitForm, reason: e.target.value })}
            >
              {REASON_CATEGORIES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Detailed Notes / Explanation (Optional)"
              size="small"
              multiline
              rows={3}
              value={submitForm.detailedReason}
              onChange={(e) => setSubmitForm({ ...submitForm, detailedReason: e.target.value })}
              placeholder="Provide any feedback or handoff context for your department..."
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Personal Email (For F&F and Relieving Letter)"
                size="small"
                value={submitForm.personalEmail}
                onChange={(e) => setSubmitForm({ ...submitForm, personalEmail: e.target.value })}
              />
              <TextField
                label="Personal Phone Number"
                size="small"
                value={submitForm.contactNumber}
                onChange={(e) => setSubmitForm({ ...submitForm, contactNumber: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSubmitDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#14286D', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0f1e54' } }}
            >
              Confirm & Submit Notice
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 2: Manager Review */}
      <Dialog
        open={managerReviewDialogOpen}
        onClose={() => setManagerReviewDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Manager Review: {selectedRecord?.employeeName}
        </DialogTitle>
        <form onSubmit={handleManagerReviewSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Manager Recommendation *"
              size="small"
              value={reviewForm.decision}
              onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
            >
              <MenuItem value="Approved">Recommend Approval</MenuItem>
              <MenuItem value="Rejected">Reject / Retain</MenuItem>
            </TextField>

            <TextField
              type="date"
              label="Approved Last Working Day"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={reviewForm.approvedLastWorkingDay}
              onChange={(e) => setReviewForm({ ...reviewForm, approvedLastWorkingDay: e.target.value })}
            />

            <TextField
              label="Manager Comments"
              size="small"
              multiline
              rows={2}
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              placeholder="e.g. Project handover planned with team lead by next week"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setManagerReviewDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#14286D', borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
            >
              Submit Manager Review
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 3: HR Review */}
      <Dialog
        open={hrReviewDialogOpen}
        onClose={() => setHrReviewDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          HR Official Approval: {selectedRecord?.employeeName}
        </DialogTitle>
        <form onSubmit={handleHrReviewSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="HR Final Decision *"
              size="small"
              value={reviewForm.decision}
              onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
            >
              <MenuItem value="Approved">Approve & Begin Clearance</MenuItem>
              <MenuItem value="Rejected">Reject</MenuItem>
            </TextField>

            <TextField
              type="date"
              label="Final Official Last Working Day *"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={reviewForm.approvedLastWorkingDay}
              onChange={(e) => setReviewForm({ ...reviewForm, approvedLastWorkingDay: e.target.value })}
              required
            />

            <TextField
              label="HR Comments / Policy Notes"
              size="small"
              multiline
              rows={2}
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              placeholder="e.g. Standard 30 days notice fulfilled, clearance checklist opened"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setHrReviewDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#14286D', borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
            >
              Finalize HR Approval
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 4: Clearance Management */}
      <Dialog
        open={clearanceDialogOpen}
        onClose={() => setClearanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Multi-Department Clearances: {selectedRecord?.employeeName}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* IT */}
          <Box sx={{ border: '1px solid #e2e8f0', p: 2, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>1. IT Clearance</Typography>
              <Button
                size="small"
                variant={selectedRecord?.itClearance === 'Cleared' ? 'contained' : 'outlined'}
                color={selectedRecord?.itClearance === 'Cleared' ? 'success' : 'primary'}
                onClick={() =>
                  handleSaveClearanceItem(
                    'it',
                    selectedRecord?.itClearance === 'Cleared' ? 'Pending' : 'Cleared',
                    clearanceForm.itClearanceNotes
                  )
                }
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
              >
                {selectedRecord?.itClearance === 'Cleared' ? '✓ IT Cleared' : 'Mark Cleared'}
              </Button>
            </Box>
            <TextField
              size="small"
              fullWidth
              placeholder="IT Notes (Laptop serial returned, email disabled)"
              value={clearanceForm.itClearanceNotes}
              onChange={(e) => setClearanceForm({ ...clearanceForm, itClearanceNotes: e.target.value })}
            />
          </Box>

          {/* Finance */}
          <Box sx={{ border: '1px solid #e2e8f0', p: 2, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>2. Finance Clearance</Typography>
              <Button
                size="small"
                variant={selectedRecord?.financeClearance === 'Cleared' ? 'contained' : 'outlined'}
                color={selectedRecord?.financeClearance === 'Cleared' ? 'success' : 'primary'}
                onClick={() =>
                  handleSaveClearanceItem(
                    'finance',
                    selectedRecord?.financeClearance === 'Cleared' ? 'Pending' : 'Cleared',
                    clearanceForm.financeClearanceNotes
                  )
                }
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
              >
                {selectedRecord?.financeClearance === 'Cleared' ? '✓ Finance Cleared' : 'Mark Cleared'}
              </Button>
            </Box>
            <TextField
              size="small"
              fullWidth
              placeholder="Finance Notes (Full & final settlement computed, loan cleared)"
              value={clearanceForm.financeClearanceNotes}
              onChange={(e) => setClearanceForm({ ...clearanceForm, financeClearanceNotes: e.target.value })}
            />
          </Box>

          {/* Admin */}
          <Box sx={{ border: '1px solid #e2e8f0', p: 2, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>3. Admin Clearance</Typography>
              <Button
                size="small"
                variant={selectedRecord?.adminClearance === 'Cleared' ? 'contained' : 'outlined'}
                color={selectedRecord?.adminClearance === 'Cleared' ? 'success' : 'primary'}
                onClick={() =>
                  handleSaveClearanceItem(
                    'admin',
                    selectedRecord?.adminClearance === 'Cleared' ? 'Pending' : 'Cleared',
                    clearanceForm.adminClearanceNotes
                  )
                }
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
              >
                {selectedRecord?.adminClearance === 'Cleared' ? '✓ Admin Cleared' : 'Mark Cleared'}
              </Button>
            </Box>
            <TextField
              size="small"
              fullWidth
              placeholder="Admin Notes (ID badge and desk keys returned)"
              value={clearanceForm.adminClearanceNotes}
              onChange={(e) => setClearanceForm({ ...clearanceForm, adminClearanceNotes: e.target.value })}
            />
          </Box>

          {/* Exit Interview & Letters */}
          <Box sx={{ border: '1px solid #e2e8f0', p: 2, borderRadius: '12px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a', mb: 1 }}>
              4. HR Exit Formalities
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedRecord?.exitInterviewDone || false}
                    onChange={(e) => handleSaveClearanceItem('exitInterview', e.target.checked)}
                  />
                }
                label={<Typography sx={{ fontSize: '12.5px', fontWeight: 600 }}>Exit Interview Completed</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedRecord?.relievingLetterIssued || false}
                    onChange={(e) => handleSaveClearanceItem('relievingLetter', e.target.checked)}
                  />
                }
                label={<Typography sx={{ fontSize: '12.5px', fontWeight: 600 }}>Relieving Letter Issued</Typography>}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearanceDialogOpen(false)} variant="contained" sx={{ bgcolor: '#14286D', borderRadius: '8px', textTransform: 'none' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OffboardingHub;
