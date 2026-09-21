import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import {
  Groups as GroupsIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Workspaces as WorkspacesIcon,
} from '@mui/icons-material';

const WorkgroupStatsBar = ({ workgroups = [] }) => {
  const totalGroups = workgroups.length;
  const activeGroups = workgroups.filter((g) => g.status !== 'Archived').length;
  
  const allEmployeeIds = new Set();
  workgroups.forEach((g) => {
    (g.employees || []).forEach((emp) => allEmployeeIds.add(emp.employeeId));
  });
  const totalMembersAssigned = allEmployeeIds.size;

  const publicCount = workgroups.filter((g) => g.privacyType === 'Public').length;
  const privateCount = workgroups.filter((g) => g.privacyType === 'Private').length;

  const stats = [
    {
      label: 'Active Workgroups',
      value: activeGroups,
      sublabel: `${totalGroups - activeGroups} archived`,
      icon: <WorkspacesIcon sx={{ fontSize: 24 }} />,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      label: 'Members Assigned',
      value: totalMembersAssigned,
      sublabel: 'Across all workgroups',
      icon: <GroupsIcon sx={{ fontSize: 24 }} />,
      color: '#0EA5E9',
      bgColor: '#E0F2FE',
    },
    {
      label: 'Public Groups',
      value: publicCount,
      sublabel: 'Open to all employees',
      icon: <PublicIcon sx={{ fontSize: 24 }} />,
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      label: 'Private Groups',
      value: privateCount,
      sublabel: 'Invite-only workspace',
      icon: <LockIcon sx={{ fontSize: 24 }} />,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {stats.map((stat) => (
        <Paper
          key={stat.label}
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: 3,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
            },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: stat.bgColor,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {stat.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
              {stat.value}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.82rem' }} noWrap>
              {stat.label}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }} noWrap>
              {stat.sublabel}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default WorkgroupStatsBar;
