import React, { useEffect, useState } from 'react';
import { OrganizationChart } from 'primereact/organizationchart';
import { Box, Typography, Chip, Drawer, List, ListItem, ListItemAvatar, ListItemText, Avatar } from '@mui/material';
import axios from '../api/axios';

const CompanyStructure = () => {
  const [data, setData] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const handleChipClick = (department) => {
    setSelectedDepartment(department);
    setDrawerOpen(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const companyName = localStorage.getItem('companyName');
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');

      try {
        const response = await axios.get('/users', {
          params: { companyName, role },
          headers: { Authorization: `Bearer ${token}` },
        });

        const activeUsers = response.data.filter((user) => user.exists === 1);
        setAllUsers(activeUsers);
        setData(transformToOrgStructure(activeUsers));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const transformToOrgStructure = (users) => {
    const departments = {};

    users.forEach((user) => {
      const dept = user.department || 'Other';

      if (!departments[dept]) {
        departments[dept] = { managers: [], employees: [] };
      }

      if (user.role && user.role.toLowerCase() === 'manager') {
        departments[dept].managers.push({
          type: 'person',
          data: {
            photo: user.photo,
            name: `${user.firstName} ${user.lastName}`,
            title: user.role,
            department: dept,
          },
        });
      } else {
        departments[dept].employees.push({
          photo: user.photo,
          name: `${user.firstName} ${user.lastName}`,
          title: user.role || 'Employee',
        });
      }
    });

    const departmentNodes = Object.keys(departments).map((dept) => ({
      type: 'department',
      data: { name: dept },
      expanded: true,
      children: departments[dept].managers,
      employees: departments[dept].employees,
    }));

    return [
      {
        type: 'company',
        data: { name: localStorage.getItem('companyName') || 'Company' },
        expanded: true,
        children: departmentNodes,
      },
    ];
  };

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
            p: 2,
            boxShadow: 3,
            width: '200px'
          }}
        >
          <Typography variant="body2">
            <img
              src={node.data.photo}
              alt="User"
              width="40"
              height="40"
              style={{ borderRadius: '50%' }}
            />
          </Typography>
          <Typography variant="body2">{node.data.title}</Typography>
          <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {node.data.name}
          </Typography>
          <Chip
            label="Employees"
            onClick={() => handleChipClick(node.data.department)}
            color="primary"
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          textAlign: 'center',
          bgcolor: 'white',
          color: 'black',
          borderRadius: 3,
          p: 2,
          boxShadow: 3,
          width: '200px'
        }}
      >
        <Typography sx={{ fontWeight: 'bold' }}>{node.data.name}</Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        p: 2,
      }}
    >

      {data.length > 0 ? (
        <Box
          sx={{
            width: '100%',
            '& .p-organizationchart': {
              width: '100%',
              display: 'flex',
              justifyContent: 'center', 
            },
            '& .p-organizationchart-table': {
              borderSpacing: '0 10px',
              width: '100%',
              maxWidth: '100vw', 
            },
           ರ: 'auto',
            '& .p-organizationchart-line-down': {
              backgroundColor: '#4CAF50',
              height: '20px',
            },
            '& .p-organizationchart-line-left': {
              borderRight: '2px solid #4CAF50',
            },
            '& .p-organizationchart-line-right': {
              borderLeft: '2px solid #4CAF50',
            },
            '& .p-organizationchart-line-top': {
              borderTop: '2px solid #4CAF50',
            },
            '& .p-organizationchart-node-content': {
              margin: '0 10px',
            },
          }}
        >
          <OrganizationChart value={data} nodeTemplate={nodeTemplate} />
        </Box>
      ) : (
        <Typography textAlign="center">No data available</Typography>
      )}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2, mt: '64px' }}>
          {selectedDepartment ? (
            <>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                {selectedDepartment}
              </Typography>
              <List>
                {allUsers
                  .filter((user) => (user.department || 'Other') === selectedDepartment)
                  .sort((a, b) => {
                    const roleA = (a.role || '').toLowerCase();
                    const roleB = (b.role || '').toLowerCase();
                    if (roleA === 'manager' && roleB !== 'manager') return -1;
                    if (roleB === 'manager' && roleA !== 'manager') return 1;
                    return 0;
                  })
                  .map((employee, index) => (
                    <ListItem key={index} sx={{ mb: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={employee.photo}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          sx={{ width: 40, height: 40 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${employee.firstName} ${employee.lastName}`}
                        secondary={employee.role || 'Employee'}
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                  ))}
              </List>
              {allUsers.filter((user) => (user.department || 'Other') === selectedDepartment).length === 0 && (
                <Typography variant="body2">No employees in this department.</Typography>
              )}
            </>
          ) : (
            <Typography>No department selected</Typography>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default CompanyStructure;