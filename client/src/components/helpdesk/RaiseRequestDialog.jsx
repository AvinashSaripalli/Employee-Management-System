import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider,
} from '@mui/material';
import {
  HiOutlineLifebuoy,
  HiOutlineCpuChip,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlineXMark,
} from 'react-icons/hi2';
import axios from '../../api/axios';

const CATEGORIES = [
  {
    key: 'IT_SUPPORT',
    title: 'IT Support Ticket',
    subtitle: 'Hardware, software, network, or access issues',
    icon: <HiOutlineCpuChip size={22} color="#4F46E5" />,
    color: '#4F46E5',
    subcategories: [
      'Hardware Issue / Defect',
      'Software License & Tools',
      'VPN & Network Access',
      'Email / Account Password Reset',
      'Development Environment',
      'Other IT Problem',
    ],
  },
  {
    key: 'ASSET_REQUEST',
    title: 'Company Asset Request',
    subtitle: 'Requisition laptops, monitors, peripherals, or accessories',
    icon: <HiOutlineCube size={22} color="#059669" />,
    color: '#059669',
    subcategories: [
      'Laptop / Workstation',
      'Secondary Monitor',
      'Keyboard & Mouse',
      'Noise-Canceling Headset',
      'USB Hub / Power Adapter',
      'Other Hardware Accessory',
    ],
  },
  {
    key: 'HR_REQUEST',
    title: 'HR & Official Letters',
    subtitle: 'Employment letters, bonafide certificates, policy inquiries',
    icon: <HiOutlineDocumentText size={22} color="#D97706" />,
    color: '#D97706',
    subcategories: [
      'Employment Verification Letter',
      'Bonafide Certificate (Visa / Bank)',
      'Address Proof Letter',
      'HR Policy Clarification',
      'Profile / Bank Data Correction',
    ],
  },
  {
    key: 'FACILITY',
    title: 'Facilities & Workplace',
    subtitle: 'ID card reissue, desk ergonomics, office accommodations',
    icon: <HiOutlineBuildingOffice2 size={22} color="#0284C7" />,
    color: '#0284C7',
    subcategories: [
      'ID Card / Access Badge Reissue',
      'Ergonomic Support (Chair / Desk)',
      'Meeting Room Accommodation',
      'Office Supplies & Stationery',
    ],
  },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low (Routine inquiry, no work blocked)', color: '#64748B' },
  { value: 'Medium', label: 'Medium (Standard request, can proceed with work)', color: '#0284C7' },
  { value: 'High', label: 'High (Major inconvenience, deadline impacted)', color: '#EA580C' },
  { value: 'Critical', label: 'Critical (System blocked, unable to work)', color: '#DC2626' },
];

const RaiseRequestDialog = ({ open, onClose, onSuccess }) => {
  const [category, setCategory] = useState('IT_SUPPORT');
  const [subCategory, setSubCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentCategoryObj = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];

  const handleCategorySelect = (key) => {
    setCategory(key);
    const cat = CATEGORIES.find((c) => c.key === key);
    if (cat?.subcategories?.length) {
      setSubCategory(cat.subcategories[0]);
    } else {
      setSubCategory('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a short summary / title for your request.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please describe your request or issue with at least 10 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        category,
        subCategory: subCategory || currentCategoryObj.subcategories[0],
        title: title.trim(),
        description: description.trim(),
        priority,
        targetAssetCategory: category === 'ASSET_REQUEST' ? subCategory : undefined,
      };

      const res = await axios.post('/support-tickets', payload);

      // Trigger live badge count updates across the app
      window.dispatchEvent(new Event('requestCountsUpdated'));

      if (onSuccess) onSuccess(res.data?.ticket);
      handleClose();
    } catch (err) {
      console.error('Error submitting service request:', err);
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#14286D',
          color: '#ffffff',
          py: 2.2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
          <Box
            sx={{
              p: 0.8,
              bgcolor: 'rgba(255, 255, 255, 0.16)',
              borderRadius: '10px',
              display: 'flex',
            }}
          >
            <HiOutlineLifebuoy size={24} color="#ffffff" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#ffffff' }}>
              Raise Service Request / IT Ticket
            </Typography>
            <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>
              Submit an IT incident, request company equipment, or official HR documents
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={handleClose}
          sx={{ minWidth: 'auto', p: 0.6, color: '#ffffff', borderRadius: '50%' }}
        >
          <HiOutlineXMark size={22} />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {/* 1. Request Category Selector Cards */}
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#334155', mb: 1 }}>
            Select Request Type:
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              mb: 3,
            }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <Paper
                  key={cat.key}
                  elevation={0}
                  onClick={() => handleCategorySelect(cat.key)}
                  sx={{
                    p: 1.8,
                    cursor: 'pointer',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: isSelected ? cat.color : '#e2e8f0',
                    bgcolor: isSelected ? `${cat.color}08` : '#ffffff',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    '&:hover': {
                      borderColor: cat.color,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '10px',
                      bgcolor: isSelected ? `${cat.color}15` : '#f8fafc',
                      display: 'flex',
                    }}
                  >
                    {cat.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                      {cat.title}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', mt: 0.2 }}>
                      {cat.subtitle}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 2. Subcategory & Priority */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 2.5,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel id="subcategory-label">
                {category === 'ASSET_REQUEST' ? 'Equipment / Device Type' : 'Category / Classification'}
              </InputLabel>
              <Select
                labelId="subcategory-label"
                value={subCategory || currentCategoryObj.subcategories[0]}
                label={category === 'ASSET_REQUEST' ? 'Equipment / Device Type' : 'Category / Classification'}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                {currentCategoryObj.subcategories.map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="priority-label">Urgency / Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={priority}
                label="Urgency / Priority"
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: p.color,
                        }}
                      />
                      <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{p.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 3. Title */}
          <TextField
            fullWidth
            size="small"
            label="Subject / Summary"
            placeholder={
              category === 'ASSET_REQUEST'
                ? 'e.g., Request for secondary 27-inch monitor for development work'
                : category === 'HR_REQUEST'
                ? 'e.g., Requesting Employment Verification Letter for Apartment Lease'
                : 'e.g., External monitor flickering when connected via HDMI adapter'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2.5 }}
            required
          />

          {/* 4. Description */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label={
              category === 'ASSET_REQUEST'
                ? 'Business Justification & Specifications'
                : 'Detailed Description / Steps to Reproduce'
            }
            placeholder={
              category === 'ASSET_REQUEST'
                ? 'Please specify your business need, required ports, preferred model, and delivery location...'
                : 'Please explain what happened, any error messages displayed, and any troubleshooting steps already taken...'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            helperText="Provide sufficient context to help IT or HR resolve this swiftly."
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <HiOutlineLifebuoy size={18} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#14286D',
              px: 3,
              borderRadius: '8px',
              '&:hover': { bgcolor: '#0f1e54' },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RaiseRequestDialog;
