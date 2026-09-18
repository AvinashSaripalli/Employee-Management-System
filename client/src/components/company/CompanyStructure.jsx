import React, { useEffect, useState } from 'react';
import { OrganizationChart } from 'primereact/organizationchart';
import {
  Box, Typography, Chip, Drawer, List, ListItem, ListItemAvatar, ListItemText, Avatar,
  ListItemButton, Snackbar, Alert, Stack,
} from '@mui/material';
import axios from '../../api/axios';
import AssignEmployeeDialog from './AssignEmployeeDialog';

const CompanyStructure = () => {
  const [data, setData] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [assignUser, setAssignUser] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchUsers = async () => {
    const companyName = localStorage.getItem('companyName');
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/users', {
        params: { companyName },
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeUsers = response.data.filter((user) => user.exists === 1);
      setAllUsers(activeUsers);
      setData(transformToOrgStructure(activeUsers));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transformToOrgStructure = (users) => {
    const departments = {};

    users.forEach((user) => {
      const dept = (user.department || '').trim();

      if (!departments[dept]) {
        departments[dept] = { managers: [], employees: [] };
      }

      const node = {
        type: 'person',
        data: {
          id: user.id,
          photo: user.photo,
          name: `${user.firstName} ${user.lastName}`,
          title: `${user.designation || user.role || 'Employee'}${user.role === 'Manager' ? ' · Manager' : ''}`,
          department: dept,
        },
      };

      if (user.role && user.role.toLowerCase() === 'manager') {
        departments[dept].managers.push(node);
      } else {
        departments[dept].employees.push(node);
      }
    });

    const departmentNodes = Object.keys(departments)
      .sort((a, b) => (a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : a.localeCompare(b)))
      .filter((dept) => dept !== '' || departments[dept].managers.length + departments[dept].employees.length > 0)
      .map((dept) => {
        const label = dept || 'Unassigned';
        return {
          type: 'department',
          data: { name: label, count: departments[dept].managers.length + departments[dept].employees.length },
          expanded: true,
          children: departments[dept].managers,
          employees: departments[dept].employees,
        };
      });

    const unassigned = departments[''] || { managers: [], employees: [] };
    if (unassigned.managers.length + unassigned.employees.length > 0) {
      departmentNodes.unshift({
        type: 'department',
        data: { name: 'Unassigned', count: unassigned.managers.length + unassigned.employees.length },
        expanded: true,
        isUnassigned: true,
        children: unassigned.managers,
        employees: unassigned.employees,
      });
    }

    return [
      {
        type: 'company',
        data: { name: (localStorage.getItem('companyName') || 'Company').split(' ')[0].toUpperCase() },
        expanded: true,
        children: departmentNodes,
      },
    ];
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');

  const nodeTemplate = (node) => {
    if (node.type === 'person') {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'white',
            color: 'black',
            borderRadius: 3,
            p: 1.4,
            boxShadow: 4,
            width: 168,
            border: '1px solid #E8EEF9',
          }}
        >
          <Avatar
            src={node.data.photo}
            sx={{ width: 46, height: 46, mb: 0.75, bgcolor: '#14286D', color: '#fff', fontWeight: 'bold', fontSize: 16 }}
          >
            {getInitials(node.data.name)}
          </Avatar>
          <Typography sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: 13, lineHeight: 1.25 }}>
            {node.data.name}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#8A94B0', textAlign: 'center', mt: 0.3 }}>
            {node.data.title}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        onClick={() => handleChipClick(node.data.name)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: node.data.name === 'Unassigned' ? '#FFF5EC' : '#14286D',
          color: node.data.name === 'Unassigned' ? '#E8590C' : '#fff',
          borderRadius: 2.5,
          px: 2,
          py: 1,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: node.data.name === 'Unassigned' ? '0 4px 12px rgba(232,89,12,0.18)' : '0 6px 16px rgba(20,40,109,0.22)',
          '&:hover': { transform: 'translateY(-1px)', opacity: 0.94 },
        }}
      >
        <Typography sx={{ fontWeight: 'bold', fontSize: 14 }}>{node.data.name}</Typography>
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.9)',
            color: node.data.name === 'Unassigned' ? '#E8590C' : '#14286D',
            borderRadius: 2,
            px: 1,
            minWidth: 24,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {node.data.count}
        </Box>
      </Box>
    );
  };

  const handleChipClick = (department) => {
    setSelectedDepartment(department);
    setDrawerOpen(true);
  };

  const drawerUsers = selectedDepartment
    ? allUsers
        .filter((user) => (user.department || '').trim() === selectedDepartment)
        .sort((a, b) => {
          const ra = (a.role || '').toLowerCase();
          const rb = (b.role || '').toLowerCase();
          if (ra === 'manager' && rb !== 'manager') return -1;
          if (rb === 'manager' && ra !== 'manager') return 1;
          return 0;
        })
    : [];

  const handleAssignOpen = (user) => {
    setAssignUser(user);
    setAssignOpen(true);
  };

  const handleAssigned = () => {
    setAssignOpen(false);
    fetchUsers();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: '-0.02em' }}>
            Company Structure
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
            Visualize your organization and keep every teammate assigned to a department.
          </Typography>
        </Box>
        <Chip
          label={`${allUsers.length} employees`}
          sx={{ bgcolor: '#E8EEF9', color: '#14286D', fontWeight: 700, display: { xs: 'none', sm: 'flex' } }}
        />
      </Stack>

      {data.length > 0 ? (
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            '& .p-organizationchart': { width: '100%', display: 'flex', justifyContent: 'center' },
            '& .p-organizationchart-table': {
              borderSpacing: '0 10px',
              width: '100%',
              maxWidth: '100vw',
            },
            '& .p-organizationchart-line-down': { backgroundColor: '#B9C6E8', height: '18px' },
            '& .p-organizationchart-line-left': { borderRight: '2px solid #B9C6E8' },
            '& .p-organizationchart-line-right': { borderLeft: '2px solid #B9C6E8' },
            '& .p-organizationchart-line-top': { borderTop: '2px solid #B9C6E8' },
            '& .p-organizationchart-node-content': { margin: '0 10px' },
          }}
        >
          <OrganizationChart value={data} nodeTemplate={nodeTemplate} />
        </Box>
      ) : (
        <Typography textAlign="center" color="text.secondary" sx={{ py: 4 }}>
          No employees yet — register team members and they&apos;ll appear here.
        </Typography>
      )}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 340, p: 2, mt: '68px' }}>
          {selectedDepartment ? (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedDepartment}
                </Typography>
                <Chip label={`${drawerUsers.length}`} size="small" sx={{ bgcolor: '#14286D', color: '#fff', fontWeight: 700 }} />
              </Stack>

              {selectedDepartment === 'Unassigned' && (
                <Typography sx={{ fontSize: 13, color: '#B3560F', bgcolor: '#FFF5EC', p: 1.5, borderRadius: 2, mb: 2 }}>
                  These employees registered but haven&apos;t been placed in a department. Assign them to a team.
                </Typography>
              )}

              <List>
                {drawerUsers.map((user) => (
                  <ListItem
                    key={user.id}
                    secondaryAction={
                      <ListItemButton
                        onClick={() => handleAssignOpen(user)}
                        sx={{
                          minWidth: 'auto',
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                          bgcolor: '#14286D',
                          color: '#fff',
                          '&:hover': { bgcolor: '#1D359B' },
                        }}
                      >
                        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Assign</Typography>
                      </ListItemButton>
                    }
                    sx={{ mb: 1, bgcolor: '#F7F9FE', borderRadius: 2.5, border: '1px solid #E8EEF9' }}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.photo} sx={{ width: 40, height: 40, bgcolor: '#14286D', color: '#fff', fontSize: 14 }}>
                        {getInitials(`${user.firstName} ${user.lastName}`)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={user.designation || user.role || 'Employee'}
                      primaryTypographyProps={{ fontWeight: 'bold', fontSize: 14 }}
                    />
                  </ListItem>
                ))}
              </List>

              {drawerUsers.length === 0 && (
                <Typography color="text.secondary" variant="body2">
                  No employees in this department.
                </Typography>
              )}
            </>
          ) : (
            <Typography>No department selected</Typography>
          )}
        </Box>
      </Drawer>

      <AssignEmployeeDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        user={assignUser}
        onAssigned={handleAssigned}
      />
    </Box>
  );
};

export default CompanyStructure;
