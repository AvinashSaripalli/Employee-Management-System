import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
} from '@mui/material';
import {
  FiMail,
  FiX,
  FiSend,
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiUsers,
  FiLink,
  FiCheckCircle,
  FiAlertCircle,
  FiKey,
} from 'react-icons/fi';
import axios from '../../api/axios';
import useDepartments from '../../hooks/useDepartments';

const ROLES = ['Employee', 'Manager', 'Admin'];

const InviteEmployeesDialog = ({ open, onClose, onInviteSuccess }) => {
  const { departmentNames } = useDepartments();
  const [tabIndex, setTabIndex] = useState(0);

  // Form State
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('KN Advisors');
  const [designation, setDesignation] = useState('Associate');
  const [customMessage, setCustomMessage] = useState('');

  // UI / Status State
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [resultData, setResultData] = useState(null);

  const portalUrl = window.location.origin;

  const handleAddEmail = (rawText) => {
    if (!rawText) return;
    const tokens = rawText
      .split(/[\n,; ]+/)
      .map((t) => t.trim())
      .filter((t) => t && t.includes('@'));

    const next = [...emails];
    tokens.forEach((t) => {
      if (!next.includes(t)) next.push(t);
    });
    setEmails(next);
    setEmailInput('');
    setErrorMsg('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddEmail(emailInput);
    }
  };

  const handleRemoveEmail = (target) => {
    setEmails(emails.filter((e) => e !== target));
  };

  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCreds((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedCreds((prev) => ({ ...prev, [key]: false }));
    }, 2500);
  };

  const resetForm = () => {
    setEmailInput('');
    setEmails([]);
    setFirstName('');
    setLastName('');
    setRole('Employee');
    setDepartment('KN Advisors');
    setDesignation('Associate');
    setCustomMessage('');
    setErrorMsg('');
    setResultData(null);
    setTabIndex(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // If user typed an email without pressing enter, add it
    let currentEmails = [...emails];
    if (emailInput && emailInput.includes('@') && !currentEmails.includes(emailInput.trim())) {
      currentEmails.push(emailInput.trim());
      setEmails(currentEmails);
      setEmailInput('');
    }

    if (currentEmails.length === 0) {
      setErrorMsg('Please enter at least one valid recipient email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      const companyName = localStorage.getItem('companyName') || 'KN Advisors';

      const payload = {
        emails: currentEmails,
        firstName: currentEmails.length === 1 ? firstName : '',
        lastName: currentEmails.length === 1 ? lastName : '',
        role,
        department,
        designation,
        customMessage,
        companyName,
      };

      const res = await axios.post('/users/invite', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResultData(res.data);
      if (onInviteSuccess) {
        onInviteSuccess(res.data);
      }
    } catch (err) {
      console.error('Error inviting users:', err);
      setErrorMsg(
        err.response?.data?.error || err.response?.data?.message || 'Failed to send invitations. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* Header */}
      <DialogTitle sx={{ m: 0, p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: '#EEF2FF',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiMail size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              Invite Team Members
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
              Send branded email invitations with workspace credentials and direct access
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <FiX size={20} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, bgcolor: '#F8FAFC' }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)}>
          <Tab icon={<FiMail size={16} />} iconPosition="start" label="Email Invitation" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab icon={<FiLink size={16} />} iconPosition="start" label="Shareable Portal Link" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {/* Success / Result State */}
        {resultData ? (
          <Box sx={{ py: 1 }}>
            <Box
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 2.5,
                bgcolor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box sx={{ color: '#16A34A', display: 'flex' }}>
                <FiCheckCircle size={32} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#166534' }}>
                  Invitations Processed Successfully!
                </Typography>
                <Typography variant="body2" sx={{ color: '#15803D' }}>
                  {resultData.message}
                </Typography>
              </Box>
            </Box>

            {/* Generated Accounts Table with Credentials */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiKey size={16} color="#4F46E5" /> Credentials & Invitation Summary
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
              <Table size="small">
                <TableBody>
                  {resultData.results?.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{item.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.employeeId || 'Existing ID'}
                          size="small"
                          sx={{ bgcolor: '#EEF2FF', color: 'primary.main', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        {item.tempPassword ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              {item.tempPassword}
                            </code>
                            <Tooltip title={copiedCreds[item.email] ? 'Copied!' : 'Copy Password'}>
                              <IconButton size="small" onClick={() => handleCopyText(item.tempPassword, item.email)}>
                                {copiedCreds[item.email] ? <FiCheck size={14} color="#16A34A" /> : <FiCopy size={14} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Existing account password
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.status === 'sent' ? (
                          <Chip label="Email Sent" size="small" color="success" variant="outlined" />
                        ) : (
                          <Tooltip title={item.mailError || 'Logged for SMTP dispatch'}>
                            <Chip label="Credentials Ready" size="small" color="warning" variant="outlined" />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Recipients can sign in at <strong>{portalUrl}</strong> using their registered email and employee credentials.
            </Alert>
          </Box>
        ) : tabIndex === 0 ? (
          /* Email Invitation Form */
          <Stack spacing={2.5}>
            {/* Email Input & Chips */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.8 }}>
                Recipient Email(s) <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Type email address and press Enter or comma (e.g. employee@knadvisors.com)..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => handleAddEmail(emailInput)}
                helperText="You can paste multiple emails separated by commas or line breaks."
              />
              {emails.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2 }}>
                  {emails.map((e) => (
                    <Chip
                      key={e}
                      label={e}
                      size="small"
                      onDelete={() => handleRemoveEmail(e)}
                      sx={{ bgcolor: '#EEF2FF', color: 'primary.main', fontWeight: 600 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* If only single recipient, optional Name inputs */}
            {emails.length <= 1 && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First Name (Optional)"
                  size="small"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Sarah"
                />
                <TextField
                  label="Last Name (Optional)"
                  size="small"
                  fullWidth
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Jenkins"
                />
              </Stack>
            )}

            {/* Role, Department, Designation */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={department}
                  label="Department"
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departmentNames.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Designation"
                size="small"
                fullWidth
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Financial Analyst"
              />
            </Stack>

            {/* Custom Welcome Message */}
            <TextField
              label="Personal Welcome Note (Optional)"
              size="small"
              multiline
              rows={2}
              fullWidth
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Welcome to the KN Advisors advisory team! Please sign in to access your assigned workgroups and company schedule."
            />

            {/* Live Branded Email Preview Accordion */}
            <Accordion variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<FiChevronDown size={18} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiMail size={16} color="#4F46E5" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    Preview Invitation Email (as recipient sees it)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: '#F8FAFC', p: 2 }}>
                <Box
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Mock Email Header */}
                  <Box sx={{ background: 'linear-gradient(135deg, #14286D 0%, #1E3A8A 100%)', p: 2, textAlign: 'center', color: '#FFFFFF' }}>
                    <Box
                      sx={{
                        display: 'inline-block',
                        bgcolor: '#FFFFFF',
                        color: '#14286D',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        mb: 0.5,
                      }}
                    >
                      KN
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                      KN Advisors
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Employee Portal Invitation
                    </Typography>
                  </Box>

                  {/* Mock Email Body */}
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                      Hello, {firstName || 'Team Member'}! 👋
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                      You've been invited to join the team on the KN Advisors Employee Management System.
                    </Typography>

                    {customMessage && (
                      <Box sx={{ p: 1.2, mb: 1.5, bgcolor: '#EEF2FF', borderLeft: '3px solid #4F46E5', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#3730A3' }}>
                          "{customMessage}"
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0', mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.8 }}>
                        ACCOUNT DETAILS
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          <strong>Role:</strong> {role}
                        </Typography>
                        <Typography variant="caption">
                          <strong>Department:</strong> {department}
                        </Typography>
                        <Typography variant="caption">
                          <strong>Designation:</strong> {designation}
                        </Typography>
                        <Typography variant="caption">
                          <strong>Password:</strong> Auto-generated secure temporary password (e.g. KN@4F9A)
                        </Typography>
                      </Stack>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, #14286D 0%, #4F46E5 100%)',
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          px: 3,
                        }}
                      >
                        Sign In to Workspace &rarr;
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Stack>
        ) : (
          /* Shareable Portal Link Tab */
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Share this direct portal link with newly invited members or your team. Employees can bookmark this URL to access their portal dashboard.
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  WORKSPACE LOGIN URL
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', wordBreak: 'break-all' }}>
                  {portalUrl}
                </Typography>
              </Box>
              <Button
                variant={copiedLink ? 'contained' : 'outlined'}
                color={copiedLink ? 'success' : 'primary'}
                startIcon={copiedLink ? <FiCheck size={16} /> : <FiCopy size={16} />}
                onClick={handleCopyPortalLink}
                sx={{ textTransform: 'none', flexShrink: 0 }}
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </Button>
            </Paper>

            <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiUsers size={16} color="#4F46E5" /> Quick Onboarding Tips
              </Typography>
              <Stack spacing={0.8} sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>
                <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                  1. When inviting new employees, credentials and onboarding links are emailed automatically.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                  2. Existing employees can also receive an onboarding/credential reminder via the action menu on any row.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                  3. Employees are requested to update their temporary password under <strong>Profile</strong> upon first sign in.
                </Typography>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#F8FAFC' }}>
        {resultData ? (
          <Button variant="contained" onClick={handleClose} sx={{ minWidth: 100 }}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none', color: 'text.secondary' }}>
              Cancel
            </Button>
            {tabIndex === 0 && (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || (emails.length === 0 && !emailInput)}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FiSend size={16} />}
                sx={{
                  background: 'linear-gradient(135deg, #14286D 0%, #4F46E5 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {loading
                  ? 'Sending Invitations...'
                  : `Send ${emails.length > 1 ? `${emails.length} Invitations` : 'Invitation'}`}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InviteEmployeesDialog;
