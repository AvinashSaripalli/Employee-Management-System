import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box,
  IconButton, Button, Chip, Avatar, Tooltip, Divider, Grid,
} from '@mui/material';
import {
  HiOutlineXMark, HiOutlinePencilSquare, HiOutlineClipboardDocument,
  HiOutlineCheck, HiOutlineEnvelope, HiOutlinePhone, HiOutlineBuildingOffice2,
  HiOutlineBriefcase, HiOutlineMapPin, HiOutlineCalendarDays,
  HiOutlineIdentification, HiOutlineHeart, HiOutlineUser,
} from 'react-icons/hi2';
import dayjs from 'dayjs';

const getInitials = (user) => {
  if (!user) return 'U';
  const first = user.firstName ? user.firstName[0] : '';
  const last = user.lastName ? user.lastName[0] : '';
  return (first + last).toUpperCase() || (user.email ? user.email[0].toUpperCase() : 'U');
};

const formatDateOfBirth = (dob) => {
  if (!dob) return null;
  const parsed = dayjs(dob);
  if (!parsed.isValid()) return null;
  const formatted = parsed.format('DD MMM YYYY');
  const years = dayjs().diff(parsed, 'year');
  return years > 0 ? `${formatted} (${years} yrs)` : formatted;
};

const ViewEmployeeDialog = ({ open, onClose, user, onEdit }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!user) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const skillsList = Array.isArray(user.technicalSkills)
    ? user.technicalSkills
    : typeof user.technicalSkills === 'string' && user.technicalSkills.trim()
    ? user.technicalSkills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const formattedDob = formatDateOfBirth(user.dateOfBirth);

  const getPhotoSrc = (photo) => {
    if (!photo) return undefined;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    if (photo.startsWith('/')) return photo;
    return `/${photo}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      {/* Modal Header */}
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
            <HiOutlineUser size={19} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '16.5px', color: '#0F172A', lineHeight: 1.2 }}>
              Employee Profile
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11.5px' }}>
              Full profile details and credentials
            </Typography>
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
          <HiOutlineXMark size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: '#F8FAFC' }}>
        {/* Hero Card */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #14286D 0%, #1E3A8A 65%, #2563EB 100%)',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'center' },
            textAlign: { xs: 'center', sm: 'left' },
            gap: 2.5,
            boxShadow: '0 10px 25px -5px rgba(20, 40, 109, 0.35)',
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle decorative circles */}
          <Box
            sx={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 140,
              height: 140,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 80,
              bottom: -40,
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              pointerEvents: 'none',
            }}
          />

          {/* Profile Photo / Avatar */}
          <Avatar
            src={getPhotoSrc(user.photo)}
            alt={`${user.firstName || ''} ${user.lastName || ''}`}
            sx={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              border: '4px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
              bgcolor: '#0B1745',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '28px',
              flexShrink: 0,
            }}
          >
            {getInitials(user)}
          </Avatar>

          {/* Hero Details */}
          <Box sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, flexWrap: 'wrap', mb: 0.7 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '20px', sm: '23px' }, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {user.firstName} {user.lastName}
              </Typography>

              {user.departmentRole === 'Supervisor' && (
                <Chip
                  size="small"
                  label="Supervisor"
                  sx={{
                    bgcolor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '11px',
                    height: 22,
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  }}
                />
              )}

              {user.role && user.role !== 'Employee' && (
                <Chip
                  size="small"
                  label={user.role}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '11px',
                    height: 22,
                  }}
                />
              )}
            </Box>

            <Typography sx={{ color: '#E0E7FF', fontSize: '13.5px', fontWeight: 500, mb: 1.5 }}>
              {user.designation || 'No designation'} • {user.department || 'Unassigned Department'}
            </Typography>

            {/* Badges strip */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1.2, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.6,
                  px: 1.2,
                  py: 0.35,
                  borderRadius: '8px',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(4px)',
                  fontSize: '12px',
                  fontWeight: 650,
                  letterSpacing: '0.02em',
                }}
              >
                <HiOutlineIdentification size={15} />
                <span>{user.employeeId || 'ID Pending'}</span>
              </Box>

              {user.companyName && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.6,
                    px: 1.2,
                    py: 0.35,
                    borderRadius: '8px',
                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  <HiOutlineBuildingOffice2 size={14} />
                  <span>{user.companyName}</span>
                </Box>
              )}

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.6,
                  px: 1,
                  py: 0.35,
                  borderRadius: '8px',
                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34D399' }} />
                <span>{user.exists === 0 ? 'Inactive' : 'Active Account'}</span>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 2-Column Info Grid */}
        <Grid container spacing={2.5}>
          {/* Column 1: Organization & Work */}
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '14px',
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#14286D',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <HiOutlineBriefcase size={17} />
                Organization & Role
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                <InfoItem
                  icon={<HiOutlineBriefcase size={16} />}
                  label="Designation"
                  value={user.designation}
                  fallback="Not specified"
                />
                <InfoItem
                  icon={<HiOutlineBuildingOffice2 size={16} />}
                  label="Department"
                  value={user.department}
                  fallback="Unassigned"
                />
                <InfoItem
                  icon={<HiOutlineMapPin size={16} />}
                  label="Job Location"
                  value={user.jobLocation}
                  fallback="Not specified"
                />
                <InfoItem
                  icon={<HiOutlineIdentification size={16} />}
                  label="Department Role"
                  value={user.departmentRole || 'Member'}
                />
              </Box>
            </Box>
          </Grid>

          {/* Column 2: Personal & Contact */}
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '14px',
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#14286D',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <HiOutlineEnvelope size={17} />
                Contact & Personal
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                {/* Email with copy */}
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '11.5px', display: 'block', mb: 0.3 }}>
                    Email Address
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography
                      component="a"
                      href={`mailto:${user.email}`}
                      sx={{
                        fontSize: '13.5px',
                        fontWeight: 650,
                        color: '#14286D',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {user.email || '—'}
                    </Typography>
                    {user.email && (
                      <Tooltip title={copiedField === 'email' ? 'Copied!' : 'Copy Email'}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(user.email, 'email')}
                          sx={{ p: 0.4, color: copiedField === 'email' ? '#10B981' : '#94A3B8' }}
                        >
                          {copiedField === 'email' ? <HiOutlineCheck size={14} /> : <HiOutlineClipboardDocument size={14} />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Phone with copy */}
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '11.5px', display: 'block', mb: 0.3 }}>
                    Phone Number
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography
                      component="a"
                      href={user.phoneNumber ? `tel:${user.phoneNumber}` : undefined}
                      sx={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: user.phoneNumber ? '#0F172A' : '#94A3B8',
                        textDecoration: 'none',
                        '&:hover': user.phoneNumber ? { color: '#14286D', textDecoration: 'underline' } : {},
                      }}
                    >
                      {user.phoneNumber || 'Not provided'}
                    </Typography>
                    {user.phoneNumber && (
                      <Tooltip title={copiedField === 'phone' ? 'Copied!' : 'Copy Phone'}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(user.phoneNumber, 'phone')}
                          sx={{ p: 0.4, color: copiedField === 'phone' ? '#10B981' : '#94A3B8' }}
                        >
                          {copiedField === 'phone' ? <HiOutlineCheck size={14} /> : <HiOutlineClipboardDocument size={14} />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Date of Birth */}
                <InfoItem
                  icon={<HiOutlineCalendarDays size={16} />}
                  label="Date of Birth"
                  value={formattedDob}
                  fallback="Not specified"
                />

                {/* Gender & Blood Group Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '11.5px', display: 'block', mb: 0.3 }}>
                      Gender
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: user.gender ? '#0F172A' : '#94A3B8' }}>
                      {user.gender || 'Not specified'}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '11.5px', display: 'block', mb: 0.3 }}>
                      Blood Group
                    </Typography>
                    {user.bloodGroup ? (
                      <Chip
                        size="small"
                        icon={<HiOutlineHeart size={13} style={{ color: '#DC2626' }} />}
                        label={user.bloodGroup}
                        sx={{
                          height: 22,
                          bgcolor: '#FEF2F2',
                          color: '#B91C1C',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: '1px solid #FECACA',
                        }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8' }}>
                        Not specified
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Full-width Technical Skills Card */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '14px',
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#14286D',
                  mb: 1.5,
                }}
              >
                Technical Skills & Expertise
              </Typography>

              {skillsList.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {skillsList.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      sx={{
                        bgcolor: '#EEF2FF',
                        color: '#14286D',
                        fontWeight: 650,
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #C7D2FE',
                        py: 0.4,
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                  No technical skills listed for this employee.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          py: 2,
          px: 3,
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={onClose}
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
          Close
        </Button>

        {onEdit && (
          <Button
            onClick={() => {
              if (onEdit) onEdit(user);
            }}
            variant="contained"
            startIcon={<HiOutlinePencilSquare size={16} />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              bgcolor: '#14286D',
              color: '#FFFFFF',
              px: 2.5,
              boxShadow: '0 4px 12px rgba(20, 40, 109, 0.25)',
              '&:hover': { bgcolor: '#0B1745' },
            }}
          >
            Edit Employee Details
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const InfoItem = ({ icon, label, value, fallback = '—' }) => (
  <Box>
    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '11.5px', display: 'block', mb: 0.3 }}>
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: '13.5px',
        fontWeight: value ? 600 : 500,
        color: value ? '#0F172A' : '#94A3B8',
        display: 'flex',
        alignItems: 'center',
        gap: 0.8,
      }}
    >
      {value || fallback}
    </Typography>
  </Box>
);

export default ViewEmployeeDialog;
