import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  FiX,
  FiUserCheck,
  FiBriefcase,
  FiTrendingUp,
  FiActivity,
  FiUsers,
  FiPackage,
  FiFileText,
} from 'react-icons/fi';
import { LEAD_STATUSES, LEAD_SOURCES, OPP_STAGES, ACT_TYPES } from '../utils/crmConstants';

// Shared modern dialog shell for CRM
function CrmDialogModal({
  open,
  onClose,
  icon: Icon,
  title,
  subtitle,
  onSave,
  saveLabel,
  maxWidth = 'sm',
  children,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(20, 40, 109, 0.15)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9',
          bgcolor: '#FAFCFF',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {Icon && (
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: '#EEF2FF',
                color: '#14286D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={19} />
            </Box>
          )}
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#0F172A', lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11.5px', mt: 0.2, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#64748B',
            borderRadius: '10px',
            p: 0.8,
            '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' },
          }}
        >
          <FiX size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: '#FFFFFF' }} dividers>
        {children}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid #F1F5F9',
          bgcolor: '#FAFCFF',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#CBD5E1',
            color: '#475569',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '10px',
            px: 2.5,
            '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{
            bgcolor: '#14286D',
            color: '#FFFFFF',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: '10px',
            px: 3,
            boxShadow: '0 4px 12px rgba(20, 40, 109, 0.2)',
            '&:hover': { bgcolor: '#0D1B48' },
          }}
        >
          {saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// 1. Lead Dialog
export function LeadDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    accountName: '',
    source: 'Website',
    status: 'New',
    score: 50,
    value: 0,
    assignedTo: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...form, ...initial }
          : {
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              accountName: '',
              source: 'Website',
              status: 'New',
              score: 50,
              value: 0,
              assignedTo: '',
              notes: '',
            }
      );
    }
  }, [open, initial]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmDialogModal
      open={open}
      onClose={onClose}
      icon={FiUserCheck}
      title={initial ? 'Edit Lead' : 'Add New Lead'}
      subtitle="Capture prospect details, acquisition channel, and deal potential"
      saveLabel={initial ? 'Update Lead' : 'Create Lead'}
      onSave={() => onSave(form)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="First Name"
            required
            value={form.firstName}
            onChange={(e) => change('firstName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Last Name"
            value={form.lastName}
            onChange={(e) => change('lastName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            type="email"
            label="Email Address"
            value={form.email}
            onChange={(e) => change('email', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Phone Number"
            value={form.phone}
            onChange={(e) => change('phone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Company / Account Name"
            value={form.accountName}
            onChange={(e) => change('accountName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl size="small" fullWidth>
            <InputLabel>Source</InputLabel>
            <Select
              label="Source"
              value={form.source}
              onChange={(e) => change('source', e.target.value)}
            >
              {LEAD_SOURCES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
            >
              {LEAD_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Score (0-100)"
            value={form.score}
            onChange={(e) => change('score', Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Estimated Value ($)"
            value={form.value}
            onChange={(e) => change('value', Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="Assigned To (Emp ID)"
            value={form.assignedTo}
            onChange={(e) => change('assignedTo', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={3}
            label="Notes & Context"
            placeholder="Key discussion points, customer pain points, or next steps..."
            value={form.notes}
            onChange={(e) => change('notes', e.target.value)}
          />
        </Grid>
      </Grid>
    </CrmDialogModal>
  );
}

// 2. Account Dialog
export function AccountDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    name: '',
    industry: 'General',
    size: '1-10',
    website: '',
    city: '',
    ownerId: '',
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...form, ...initial }
          : {
              name: '',
              industry: 'General',
              size: '1-10',
              website: '',
              city: '',
              ownerId: '',
            }
      );
    }
  }, [open, initial]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmDialogModal
      open={open}
      onClose={onClose}
      icon={FiBriefcase}
      title={initial ? 'Edit Account' : 'Add New Account'}
      subtitle="Manage corporate client profile, industry domain, and ownership"
      saveLabel={initial ? 'Update Account' : 'Create Account'}
      onSave={() => onSave(form)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            label="Account / Company Name"
            required
            value={form.name}
            onChange={(e) => change('name', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Industry"
            value={form.industry}
            onChange={(e) => change('industry', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Company Size</InputLabel>
            <Select
              label="Company Size"
              value={form.size}
              onChange={(e) => change('size', e.target.value)}
            >
              {['1-10', '11-50', '51-200', '201-500', '500+'].map((sz) => (
                <MenuItem key={sz} value={sz}>
                  {sz} employees
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Website"
            placeholder="https://company.com"
            value={form.website}
            onChange={(e) => change('website', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="City / Headquarters"
            value={form.city}
            onChange={(e) => change('city', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            label="Account Owner (Employee ID)"
            value={form.ownerId}
            onChange={(e) => change('ownerId', e.target.value)}
          />
        </Grid>
      </Grid>
    </CrmDialogModal>
  );
}

// 3. Opportunity Dialog
export function OpportunityDialog({ open, onClose, onSave, initial, accounts = [] }) {
  const [form, setForm] = useState({
    title: '',
    accountId: '',
    amount: 0,
    stage: 'Lead',
    probability: 20,
    closeDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...form, ...initial, accountId: initial.accountId || '' }
          : {
              title: '',
              accountId: '',
              amount: 0,
              stage: 'Lead',
              probability: 20,
              closeDate: '',
              assignedTo: '',
            }
      );
    }
  }, [open, initial]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmDialogModal
      open={open}
      onClose={onClose}
      icon={FiTrendingUp}
      title={initial ? 'Edit Opportunity' : 'Add Opportunity'}
      subtitle="Track pipeline deal value, closing stage, and probability"
      saveLabel={initial ? 'Update Deal' : 'Create Deal'}
      onSave={() => onSave(form)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            label="Opportunity / Deal Title"
            required
            value={form.title}
            onChange={(e) => change('title', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Associated Account</InputLabel>
            <Select
              label="Associated Account"
              value={form.accountId}
              onChange={(e) => change('accountId', e.target.value)}
            >
              <MenuItem value="">None / Independent</MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Deal Amount ($)"
            value={form.amount}
            onChange={(e) => change('amount', Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Stage</InputLabel>
            <Select
              label="Stage"
              value={form.stage}
              onChange={(e) => change('stage', e.target.value)}
            >
              {OPP_STAGES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Win Prob %"
            value={form.probability}
            onChange={(e) => change('probability', Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Target Close Date"
            InputLabelProps={{ shrink: true }}
            value={form.closeDate || ''}
            onChange={(e) => change('closeDate', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            label="Assigned Lead Rep (Emp ID)"
            value={form.assignedTo}
            onChange={(e) => change('assignedTo', e.target.value)}
          />
        </Grid>
      </Grid>
    </CrmDialogModal>
  );
}

// 4. Activity Dialog
export function ActivityDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    type: 'Call',
    subject: '',
    description: '',
    relatedType: '',
    relatedId: '',
    dueDate: '',
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...form, ...initial }
          : {
              type: 'Call',
              subject: '',
              description: '',
              relatedType: '',
              relatedId: '',
              dueDate: '',
            }
      );
    }
  }, [open, initial]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmDialogModal
      open={open}
      onClose={onClose}
      icon={FiActivity}
      title={initial ? 'Edit Activity' : 'Log New Activity'}
      subtitle="Schedule calls, meetings, client tasks, or follow-up notes"
      saveLabel={initial ? 'Update Activity' : 'Schedule Activity'}
      onSave={() => onSave(form)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Activity Type</InputLabel>
            <Select
              label="Activity Type"
              value={form.type}
              onChange={(e) => change('type', e.target.value)}
            >
              {(ACT_TYPES || ['Call', 'Meeting', 'Email', 'Task', 'Note']).map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Due / Scheduled Date"
            InputLabelProps={{ shrink: true }}
            value={form.dueDate || ''}
            onChange={(e) => change('dueDate', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            label="Subject"
            required
            placeholder="e.g., Intro Demo Call, Contract review, Follow-up"
            value={form.subject}
            onChange={(e) => change('subject', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={3}
            label="Activity Summary & Action Items"
            value={form.description}
            onChange={(e) => change('description', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Related Entity</InputLabel>
            <Select
              label="Related Entity"
              value={form.relatedType}
              onChange={(e) => change('relatedType', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Lead">Lead</MenuItem>
              <MenuItem value="Account">Account</MenuItem>
              <MenuItem value="Opportunity">Opportunity</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Related Record ID"
            value={form.relatedId}
            onChange={(e) => change('relatedId', e.target.value)}
          />
        </Grid>
      </Grid>
    </CrmDialogModal>
  );
}

// 5. Contact Dialog
export function ContactDialog({ open, onClose, onSave, initial, accounts = [] }) {
  const [form, setForm] = useState({
    accountId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    isPrimary: false,
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...form, ...initial, accountId: initial.accountId || '' }
          : {
              accountId: '',
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              title: '',
              isPrimary: false,
            }
      );
    }
  }, [open, initial]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmDialogModal
      open={open}
      onClose={onClose}
      icon={FiUsers}
      title={initial ? 'Edit Contact' : 'Add New Contact'}
      subtitle="Associate stakeholder contacts and decision makers with accounts"
      saveLabel={initial ? 'Update Contact' : 'Create Contact'}
      onSave={() => onSave(form)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl size="small" fullWidth>
            <InputLabel>Associated Account</InputLabel>
            <Select
              label="Associated Account"
              value={form.accountId}
              onChange={(e) => change('accountId', e.target.value)}
            >
              <MenuItem value="">None / Standalone</MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="First Name"
            required
            value={form.firstName}
            onChange={(e) => change('firstName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Last Name"
            value={form.lastName}
            onChange={(e) => change('lastName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            type="email"
            label="Email Address"
            value={form.email}
            onChange={(e) => change('email', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Direct Phone"
            value={form.phone}
            onChange={(e) => change('phone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            size="small"
            fullWidth
            label="Job Title / Role"
            placeholder="e.g. VP of Sales, CTO, Procurement Lead"
            value={form.title}
            onChange={(e) => change('title', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl size="small" fullWidth>
            <InputLabel>Primary Contact?</InputLabel>
            <Select
              label="Primary Contact?"
              value={form.isPrimary ? '1' : '0'}
              onChange={(e) => change('isPrimary', e.target.value === '1')}
            >
              <MenuItem value="1">Yes (Primary)</MenuItem>
              <MenuItem value="0">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CrmDialogModal>
  );
}

// 6. Product Dialog
export function ProductDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Platform',
    price: 0,
    cost: 0,
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...form, ...initial }
          : {
              name: '',
              sku: '',
              category: 'Platform',
              price: 0,
              cost: 0,
            }
      );
    }
  }, [open, initial]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmDialogModal
      open={open}
      onClose={onClose}
      icon={FiPackage}
      title={initial ? 'Edit Product' : 'Add New Product'}
      subtitle="Configure catalogue items, retail pricing, and unit costs"
      saveLabel={initial ? 'Update Product' : 'Create Product'}
      onSave={() => onSave(form)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            label="Product Name"
            required
            value={form.name}
            onChange={(e) => change('name', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="SKU / Item Code"
            placeholder="e.g. SAAS-ENT-01"
            value={form.sku}
            onChange={(e) => change('sku', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => change('category', e.target.value)}
            >
              {['Platform', 'Service', 'Subscription', 'Hardware', 'Custom'].map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Selling Price ($)"
            value={form.price}
            onChange={(e) => change('price', Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Unit Cost ($)"
            value={form.cost}
            onChange={(e) => change('cost', Number(e.target.value))}
          />
        </Grid>
      </Grid>
    </CrmDialogModal>
  );
}

// 7. Quote Dialog
export function QuoteDialog({ open, onClose, onSave, initial, accounts = [], opps = [] }) {
  const [form, setForm] = useState({
    title: '',
    accountId: '',
    opportunityId: '',
    amount: 0,
    discount: 0,
    status: 'Draft',
    validUntil: '',
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              ...form,
              ...initial,
              accountId: initial.accountId || '',
              opportunityId: initial.opportunityId || '',
            }
          : {
              title: '',
              accountId: '',
              opportunityId: '',
              amount: 0,
              discount: 0,
              status: 'Draft',
              validUntil: '',
            }
      );
    }
  }, [open, initial]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmDialogModal
      open={open}
      onClose={onClose}
      icon={FiFileText}
      title={initial ? 'Edit Quote' : 'Generate New Quote'}
      subtitle="Draft commercial proposal, discount terms, and validity deadline"
      saveLabel={initial ? 'Update Quote' : 'Create Quote'}
      onSave={() => onSave(form)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            label="Proposal / Quote Title"
            required
            value={form.title}
            onChange={(e) => change('title', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Target Account</InputLabel>
            <Select
              label="Target Account"
              value={form.accountId}
              onChange={(e) => change('accountId', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>Opportunity Deal</InputLabel>
            <Select
              label="Opportunity Deal"
              value={form.opportunityId}
              onChange={(e) => change('opportunityId', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {opps.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Total Amount ($)"
            value={form.amount}
            onChange={(e) => change('amount', Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Discount %"
            value={form.discount}
            onChange={(e) => change('discount', Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
            >
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Sent">Sent</MenuItem>
              <MenuItem value="Accepted">Accepted</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Valid Until"
            InputLabelProps={{ shrink: true }}
            value={form.validUntil || ''}
            onChange={(e) => change('validUntil', e.target.value)}
          />
        </Grid>
      </Grid>
    </CrmDialogModal>
  );
}
