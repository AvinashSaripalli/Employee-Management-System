import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, Typography,
  Box, Avatar, IconButton, Grid, Divider, CircularProgress, Tooltip,
} from '@mui/material';
import {
  HiOutlineXMark, HiOutlineCamera, HiOutlineUser, HiOutlineBriefcase,
  HiOutlineBuildingOffice2, HiOutlineIdentification, HiOutlineCheck,
  HiOutlineTrash,
} from 'react-icons/hi2';
import axios from '../../api/axios';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import useDepartments from '../../hooks/useDepartments';

const DEFAULT_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'HTML & CSS', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git',
  'Spring Boot', 'Express.js', 'C++', 'C#', 'Django', 'Angular',
];

const EditEmployeeDialog = ({ open, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    employeeId: '',
    role: 'Employee',
    designation: '',
    email: '',
    phoneNumber: '',
    gender: '',
    department: '',
    jobLocation: '',
    bloodGroup: '',
    technicalSkills: [],
    dateOfBirth: null,
    photo: null,
  });

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const { departmentOptions, refresh: refreshDepartments } = useDepartments();

  useEffect(() => {
    if (user && open) {
      const skills = Array.isArray(user.technicalSkills)
        ? user.technicalSkills
        : typeof user.technicalSkills === 'string' && user.technicalSkills.trim()
        ? user.technicalSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const parsedDob = user.dateOfBirth && dayjs(user.dateOfBirth).isValid()
        ? dayjs(user.dateOfBirth)
        : null;

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.companyName || '',
        employeeId: user.employeeId || '',
        role: user.role || 'Employee',
        designation: user.designation || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
        department: user.department || '',
        jobLocation: user.jobLocation || '',
        bloodGroup: user.bloodGroup || '',
        technicalSkills: skills,
        dateOfBirth: parsedDob,
        photo: user.photo || null,
      });

      setPreviewPhotoUrl(user.photo || null);
      setErrors({});
      refreshDepartments();
    }
  }, [user, open, refreshDepartments]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Realtime field validation for valid characters (optional fields can be emptied)
    if (name === 'firstName') {
      if (value && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
        setErrors((prev) => ({ ...prev, firstName: 'Only letters and spaces allowed' }));
      } else {
        setErrors((prev) => ({ ...prev, firstName: undefined }));
      }
    } else if (name === 'lastName') {
      if (value && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
        setErrors((prev) => ({ ...prev, lastName: 'Only letters and spaces allowed' }));
      } else {
        setErrors((prev) => ({ ...prev, lastName: undefined }));
      }
    } else if (name === 'phoneNumber') {
      if (value && !/^\d{0,10}$/.test(value)) {
        setErrors((prev) => ({ ...prev, phoneNumber: 'Must contain digits only (up to 10)' }));
      } else {
        setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, photo: file }));
    const objectUrl = URL.createObjectURL(file);
    setPreviewPhotoUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPreviewPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSkillsChange = (_, value) => {
    setFormData((prev) => ({ ...prev, technicalSkills: value }));
  };

  const handleDateChange = (date) => {
    if (date && dayjs(date).isValid()) {
      if (dayjs(date).isAfter(dayjs())) {
        setErrors((prev) => ({ ...prev, dateOfBirth: 'Date of birth cannot be in the future' }));
      } else {
        setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
      }
    } else {
      setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
    }
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  };

  // Only First Name is strictly mandatory. All other fields are optional.
  const validate = () => {
    const newErrors = {};

    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name should only contain letters and single spaces.';
    }

    if (formData.lastName && formData.lastName.trim() && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name should only contain letters and single spaces.';
    }

    // Optional phone validation: only validate if entered
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
        newErrors.phoneNumber = 'Phone number must be exactly 10 digits.';
      }
    }

    // Optional Date of Birth validation: only validate if entered
    if (formData.dateOfBirth && dayjs(formData.dateOfBirth).isValid()) {
      const dob = dayjs(formData.dateOfBirth);
      const today = dayjs();
      if (dob.isAfter(today)) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future.';
      } else if (today.diff(dob, 'year') < 14) {
        newErrors.dateOfBirth = 'Employee must be at least 14 years old.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    const data = new FormData();
    data.append('firstName', formData.firstName.trim());
    data.append('lastName', (formData.lastName || '').trim());
    data.append('companyName', formData.companyName || '');
    data.append('role', formData.role || 'Employee');
    data.append('designation', (formData.designation || '').trim());
    data.append('employeeId', formData.employeeId || '');
    data.append('email', formData.email || '');
    data.append('phoneNumber', (formData.phoneNumber || '').trim());
    data.append('gender', formData.gender || '');
    data.append('department', formData.department || '');
    data.append('jobLocation', formData.jobLocation || '');

    const skillsString = Array.isArray(formData.technicalSkills)
      ? formData.technicalSkills.join(', ')
      : (formData.technicalSkills || '');
    data.append('technicalSkills', skillsString);

    if (formData.dateOfBirth && dayjs(formData.dateOfBirth).isValid()) {
      data.append('dateOfBirth', dayjs(formData.dateOfBirth).format('YYYY-MM-DD'));
    } else {
      data.append('dateOfBirth', '');
    }

    data.append('bloodGroup', formData.bloodGroup || '');

    if (formData.photo instanceof File) {
      data.append('photo', formData.photo);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/users/${user.id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error updating employee:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to update employee details.';
      setErrors((prev) => ({ ...prev, form: msg }));
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    const f = formData.firstName ? formData.firstName[0] : '';
    const l = formData.lastName ? formData.lastName[0] : '';
    return (f + l).toUpperCase() || 'U';
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
            bgcolor: '#FFFFFF',
          },
        },
      }}
    >
      {/* Header */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              bgcolor: '#EEF2FF',
              color: '#14286D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HiOutlineBriefcase size={19} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '16.5px', color: '#0F172A', lineHeight: 1.2 }}>
              Update Employee Details
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11.5px' }}>
              Edit personal, organizational, and contact details
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          disabled={isSaving}
          size="small"
          sx={{
            color: '#64748B',
            borderRadius: '10px',
            p: 0.8,
            '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' },
          }}
        >
          <HiOutlineXMark size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: '#FFFFFF' }}>
        {errors.form && (
          <Box
            sx={{
              mb: 2.5,
              p: 1.5,
              borderRadius: '10px',
              bgcolor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {errors.form}
          </Box>
        )}

        {/* Profile Photo Uploader Card */}
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '14px',
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            flexWrap: 'wrap',
          }}
        >
          <Avatar
            src={previewPhotoUrl || undefined}
            sx={{
              width: 72,
              height: 72,
              bgcolor: '#14286D',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(20, 40, 109, 0.2)',
            }}
          >
            {getInitials()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', mb: 0.3 }}>
              Employee Profile Picture
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
              Upload JPG, PNG, or GIF. Optional profile display image.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<HiOutlineCamera size={15} />}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '12px',
                  color: '#14286D',
                  borderColor: '#C7D2FE',
                  bgcolor: '#FFFFFF',
                  '&:hover': { bgcolor: '#EEF2FF', borderColor: '#818CF8' },
                }}
              >
                {previewPhotoUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>

              {previewPhotoUrl && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleRemovePhoto}
                  startIcon={<HiOutlineTrash size={14} />}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: '#EF4444',
                    '&:hover': { bgcolor: '#FEF2F2' },
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Section 1: Basic Information */}
        <Typography
          sx={{
            fontSize: '12.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#14286D',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
          }}
        >
          <HiOutlineUser size={16} />
          Personal Details
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="First Name"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName || 'Mandatory identity field'}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Last Name (Optional)"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Gender (Optional)</InputLabel>
              <Select
                name="gender"
                value={formData.gender}
                label="Gender (Optional)"
                onChange={handleChange}
              >
                <MenuItem value=""><em>None / Unspecified</em></MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Birth (Optional)"
                value={formData.dateOfBirth}
                onChange={handleDateChange}
                format="DD-MM-YYYY"
                maxDate={dayjs()}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors.dateOfBirth,
                    helperText: errors.dateOfBirth,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Blood Group (Optional)</InputLabel>
              <Select
                name="bloodGroup"
                value={formData.bloodGroup}
                label="Blood Group (Optional)"
                onChange={handleChange}
              >
                <MenuItem value=""><em>None / Unspecified</em></MenuItem>
                <MenuItem value="A +ve">A +ve</MenuItem>
                <MenuItem value="A -ve">A -ve</MenuItem>
                <MenuItem value="B +ve">B +ve</MenuItem>
                <MenuItem value="B -ve">B -ve</MenuItem>
                <MenuItem value="O +ve">O +ve</MenuItem>
                <MenuItem value="O -ve">O -ve</MenuItem>
                <MenuItem value="AB +ve">AB +ve</MenuItem>
                <MenuItem value="AB -ve">AB -ve</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 2: Organization & Work */}
        <Typography
          sx={{
            fontSize: '12.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#14286D',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
          }}
        >
          <HiOutlineBuildingOffice2 size={16} />
          Employment & Organization
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Department (Optional)</InputLabel>
              <Select
                name="department"
                value={formData.department}
                label="Department (Optional)"
                onChange={handleChange}
              >
                <MenuItem value=""><em>Unassigned</em></MenuItem>
                {departmentOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.name} sx={{ pl: 1.5 + opt.depth * 2 }}>
                    {opt.depth > 0 && <Typography component="span" sx={{ color: '#94A3B8', mr: 0.6 }}>└─</Typography>}
                    {opt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>System Role (Optional)</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="System Role (Optional)"
                onChange={handleChange}
              >
                <MenuItem value="Employee">Employee</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Designation (Optional)"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Senior Software Engineer"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Job Location (Optional)</InputLabel>
              <Select
                name="jobLocation"
                value={formData.jobLocation}
                label="Job Location (Optional)"
                onChange={handleChange}
              >
                <MenuItem value=""><em>Not specified</em></MenuItem>
                <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                <MenuItem value="Bangalore">Bangalore</MenuItem>
                <MenuItem value="Chennai">Chennai</MenuItem>
                <MenuItem value="Kerala">Kerala</MenuItem>
                <MenuItem value="Amaravati">Amaravati</MenuItem>
                <MenuItem value="Delhi">Delhi</MenuItem>
                <MenuItem value="Mumbai">Mumbai</MenuItem>
                <MenuItem value="Kolkata">Kolkata</MenuItem>
                <MenuItem value="Remote">Remote</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 3: Contact & Locked Identifiers */}
        <Typography
          sx={{
            fontSize: '12.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#14286D',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
          }}
        >
          <HiOutlineIdentification size={16} />
          Contact & Identification
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Phone Number (Optional)"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber || '10 digits without country code'}
              placeholder="e.g. 9876543210"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Employee ID (System Locked)"
              value={formData.employeeId}
              disabled
              helperText="Managed automatically by the system"
              sx={{ bgcolor: '#F8FAFC' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Corporate Email (System Locked)"
              value={formData.email}
              disabled
              sx={{ bgcolor: '#F8FAFC' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Company Name (System Locked)"
              value={formData.companyName}
              disabled
              sx={{ bgcolor: '#F8FAFC' }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 4: Skills */}
        <Typography
          sx={{
            fontSize: '12.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#14286D',
            mb: 1.5,
          }}
        >
          Technical Skills & Technologies (Optional)
        </Typography>

        <Autocomplete
          multiple
          freeSolo
          options={DEFAULT_SKILLS}
          value={formData.technicalSkills}
          onChange={handleSkillsChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  sx={{
                    bgcolor: '#EEF2FF',
                    color: '#14286D',
                    fontWeight: 650,
                    borderRadius: '6px',
                    border: '1px solid #C7D2FE',
                  }}
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Add or select skills"
              placeholder="Type a skill and press Enter"
            />
          )}
        />
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          py: 2,
          px: 3,
          bgcolor: '#FAFCFF',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={onClose}
          disabled={isSaving}
          variant="outlined"
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '13px',
            color: '#475569',
            borderColor: '#CBD5E1',
            px: 2.5,
            '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <HiOutlineCheck size={16} />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '13px',
            bgcolor: '#14286D',
            color: '#FFFFFF',
            px: 3,
            boxShadow: '0 4px 12px rgba(20, 40, 109, 0.25)',
            '&:hover': { bgcolor: '#0B1745' },
          }}
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEmployeeDialog;