import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Paper, Chip } from '@mui/material';
import LeaveApprovals from './LeaveApprovals';
import MyLeaves from './MyLeaves';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DateRangeIcon from '@mui/icons-material/DateRange';
import axios from '../../api/axios';
import { leaveIdentityParams } from '../../utils/leaveConfig';

const ManageLeaves = ({ initialTab }) => {
  const userRole = String(localStorage.getItem('userRole') || '').toLowerCase();
  const departmentRole = String(localStorage.getItem('departmentRole') || '').toLowerCase();
  const canReview = ['admin', 'manager', 'hr'].includes(userRole) || departmentRole === 'supervisor';

  const computeActiveTab = (target) => {
    if (!canReview) return 0;
    if (target === 'My Leaves' || target === 'my_leaves') return 1;
    return 0; // 'Leave Approvals & Records'
  };

  const [activeTab, setActiveTab] = useState(() => computeActiveTab(initialTab));
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!canReview) return;
    try {
      const res = await axios.get('/leaves/leave-counts', { params: leaveIdentityParams() });
      if (res.data?.pending !== undefined) {
        setPendingLeavesCount(res.data.pending);
      }
    } catch (err) {
      console.error('Failed to load leave counts in ManageLeaves:', err);
    }
  }, [canReview]);

  useEffect(() => {
    fetchCounts();
    window.addEventListener('requestCountsUpdated', fetchCounts);
    return () => window.removeEventListener('requestCountsUpdated', fetchCounts);
  }, [fetchCounts]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(computeActiveTab(initialTab));
    }
  }, [initialTab, canReview]);

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
      {/* If reviewer (Admin, Manager, Supervisor): show multi-tab navigation */}
      {canReview ? (
        <>
          <Paper
            elevation={0}
            sx={{
              mb: 2.5,
              px: 2,
              pt: 0.5,
              bgcolor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(20, 40, 109, 0.03)',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '13.5px',
                  color: '#64748B',
                  px: { xs: 1.5, sm: 2.5 },
                  '&.Mui-selected': {
                    color: '#14286D',
                    fontWeight: 750,
                  },
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#14286D',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab
                icon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Leave Approvals & Records</span>
                    {pendingLeavesCount > 0 && (
                      <Chip
                        label={pendingLeavesCount}
                        size="small"
                        sx={{
                          height: 20,
                          minWidth: 20,
                          px: 0.6,
                          fontSize: '11px',
                          fontWeight: 800,
                          bgcolor: activeTab === 0 ? '#14286D' : '#EF4444',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                        }}
                      />
                    )}
                  </Box>
                }
              />
              <Tab
                icon={<DateRangeIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="My Leaves"
              />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          {activeTab === 0 ? <LeaveApprovals /> : <MyLeaves />}
        </>
      ) : (
        /* Regular employee: direct access to My Leaves with modal dialog application */
        <MyLeaves />
      )}
    </Box>
  );
};

export default ManageLeaves;
