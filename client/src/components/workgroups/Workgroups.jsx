
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  Grid,
  TextField,
DialogActions,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import axios from '../../api/axios';
import { Close as CloseIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';

const Workgroups = () => {
  const [workgroups, setWorkgroups] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [createGroups, setCreateGroups] = useState({
    partnerCompanyName: '',
    createdOn: '',
    privacyType: '',
    employeers: [],
  });
  const [isEditMode, setIsEditMode] = useState(false); // Track edit mode
  const [selectedWorkgroupId, setSelectedWorkgroupId] = useState(null); // Track workgroup ID for editing

  const fetchWorkGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const companyName = localStorage.getItem('companyName');

      const response = await axios.get('/workgroups', {
        headers: { Authorization: `Bearer ${token}` },
        params: { companyName },
      });
      setWorkgroups(response.data);
    } catch (error) {
      console.error('Error fetching workgroups:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const companyName = localStorage.getItem('companyName');

      const response = await axios.get('/users/employees', {
        headers: { Authorization: `Bearer ${token}` },
        params: { companyName },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchWorkGroups();
  }, []);

  useEffect(() => {
    if (openDialog) {
      fetchUsers();
    }
  }, [openDialog]);

  const groupedWorkgroups = workgroups.reduce((acc, workgroup) => {
    const { partnerCompanyName, employeeId } = workgroup;
    if (!acc[partnerCompanyName]) {
      acc[partnerCompanyName] = {
        id: workgroup.id,
        companyName: workgroup.companyName,
        createdOn: workgroup.createdOn,
        privacyType: workgroup.privacyType,
        employees: new Map(),
      };
    }
    if (!acc[partnerCompanyName].employees.has(employeeId)) {
      acc[partnerCompanyName].employees.set(employeeId, {
        employeeId,
        firstName: workgroup.firstName,
        lastName: workgroup.lastName,
        email: workgroup.email,
        designation: workgroup.designation,
        department: workgroup.department,
        technicalSkills: workgroup.technicalSkills,
        photo: workgroup.photo,
      });
    }
    return acc;
  }, {});

  const groupedData = Object.entries(groupedWorkgroups).map(([partnerCompanyName, data]) => ({
    partnerCompanyName,
    id: data.id,
    companyName: data.companyName,
    createdOn: data.createdOn,
    privacyType: data.privacyType,
    employees: Array.from(data.employees.values()),
  }));

  const handleAvatarGroupClick = (event, employees) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployees(employees);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCreateGroups((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const workgroupsData = {
        partnerCompanyName: createGroups.partnerCompanyName,
        createdOn: createGroups.createdOn,
        privacyType: createGroups.privacyType,
        employeers: createGroups.employeers,
      };

      if (isEditMode) {
        // Update workgroup
        await axios.put(`/workgroups/${selectedWorkgroupId}`, workgroupsData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        // Create new workgroup
        await axios.post('/workgroups/', workgroupsData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      setOpenDialog(false);
      setIsEditMode(false);
      setSelectedWorkgroupId(null);
      setCreateGroups({
        partnerCompanyName: '',
        createdOn: '',
        privacyType: '',
        employeers: [],
      });
      fetchWorkGroups();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} workgroup:`, error);
    }
  };

  const handleEditClick = (group) => {
    setIsEditMode(true);
    setSelectedWorkgroupId(group.id);
    setCreateGroups({
      partnerCompanyName: group.partnerCompanyName,
      createdOn: group.createdOn.split('T')[0], // Format date for input
      privacyType: group.privacyType,
      employeers: group.employees.map((emp) => emp.employeeId),
    });
    setOpenDialog(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployees([]);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setIsEditMode(false);
    setSelectedWorkgroupId(null);
    setCreateGroups({
      partnerCompanyName: '',
      createdOn: '',
      privacyType: '',
      employeers: [],
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Work Groups
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>
            Collaborate with partner companies and manage cross-company groups
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setIsEditMode(false);
            setOpenDialog(true);
          }}
        >
          Add WorkGroup
        </Button>
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: '462px',
          overflowY: 'auto',
          borderRadius: 3,
          border: '1px solid #E8EEF9',
          boxShadow: '0 6px 18px rgba(20,40,109,0.07)',
        }}
      >
        <Table stickyHeader aria-label="workgroups table">
          <TableHead sx={{ backgroundColor: '#f4f7fe' }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                ID
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Partner Company
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Date Created
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Privacy Type
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Employees
              </TableCell>
              <TableCell>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupedData.length > 0 ? (
              groupedData.map((group) => (
                <TableRow key={group.id} hover>
                  <TableCell align="center">{group.id}</TableCell>
                  <TableCell align="left">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {group.partnerCompanyName}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {new Date(group.createdOn).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={group.privacyType}
                      color={group.privacyType === 'Public' ? 'info' : 'secondary'}
                      variant="outlined"
                      sx={{ width: '100px', minWidth: 'unset' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <AvatarGroup
                      max={3}
                      sx={{ justifyContent: 'center', cursor: 'pointer' }}
                      onClick={(event) => handleAvatarGroupClick(event, group.employees)}
                    >
                      {group.employees.map((emp) => (
                        <Avatar
                          key={emp.employeeId}
                          src={emp.photo ? `${emp.photo}` : undefined}
                          alt={`${emp.firstName} ${emp.lastName}`}
                          sx={{ width: 40, height: 40 }}
                          title={`${emp.firstName} ${emp.lastName}`}
                        />
                      ))}
                    </AvatarGroup>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleEditClick(group)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No workgroups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { maxHeight: '400px', width: '400px' },
        }}
      >
        {selectedEmployees.map((emp) => (
          <MenuItem
            key={emp.employeeId}
            onClick={() => {
              setSelectedEmployeeDetails(emp);
              setDialogOpen(true);
              handleMenuClose();
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={emp.photo ? `${emp.photo}` : undefined}
                alt={`${emp.firstName} ${emp.lastName}`}
                sx={{ width: 40, height: 40 }}
              />
              <Box>
                <Typography variant="body2">
                  <strong>Name:</strong> {emp.firstName} {emp.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {emp.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Designation:</strong> {emp.designation}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Employee Details
          <IconButton
            color="inherit"
            onClick={() => setDialogOpen(false)}
            aria-label="close"
            sx={{
              position: 'absolute',
              right: 8,
              top: 14,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmployeeDetails && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar
                src={selectedEmployeeDetails.photo ? `${selectedEmployeeDetails.photo}` : undefined}
                alt={`${selectedEmployeeDetails.firstName} ${selectedEmployeeDetails.lastName}`}
                sx={{ width: 80, height: 80 }}
              />
              <Box>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedEmployeeDetails.firstName} {selectedEmployeeDetails.lastName}
                </Typography>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedEmployeeDetails.firstName} {selectedEmployeeDetails.lastName}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {selectedEmployeeDetails.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Designation:</strong> {selectedEmployeeDetails.designation}
                </Typography>
                <Typography variant="body1">
                  <strong>Department:</strong> {selectedEmployeeDetails.department}
                </Typography>
                <Typography variant="body1">
                  <strong>Skills:</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                  {(selectedEmployeeDetails.technicalSkills || '')
                    .split(',')
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                    .map((skill, idx) => (
                      <Chip key={idx} label={skill} />
                    ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Edit WorkGroup' : 'Add WorkGroups'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Company Name"
            name="partnerCompanyName"
            margin="normal"
            fullWidth
            value={createGroups.partnerCompanyName}
            onChange={handleChange}
          />
          <TextField
            type="date"
            label="Created On"
            InputLabelProps={{ shrink: true }}
            margin="normal"
            value={createGroups.createdOn}
            onChange={handleChange}
            fullWidth
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Privacy Type</InputLabel>
            <Select
              name="privacyType"
              value={createGroups.privacyType}
              onChange={handleChange}
              label="Privacy Type"
            >
              <MenuItem value="Public">Public</MenuItem>
              <MenuItem value="Private">Private</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            id="add-employees"
            options={users}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            value={users.filter((user) => createGroups.employeers.includes(user.employeeId))}
            onChange={(event, newValue) => {
              setCreateGroups((prev) => ({
                ...prev,
                employeers: newValue.map((user) => user.employeeId),
              }));
            }}
            filterSelectedOptions
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Employees"
                margin="normal"
                fullWidth
                placeholder="Add employees..."
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.employeeId}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={option.photo || undefined}
                    alt={`${option.firstName} ${option.lastName}`}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box>
                    <Typography variant="body2">
                      <strong>Name:</strong> {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Department:</strong> {option.department}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {option.email}
                    </Typography>
                  </Box>
                  </Box>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((user, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      avatar={
                        <Avatar
                          src={user.photo || undefined}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                      }
                      label={`${user.firstName} ${user.lastName}`}
                      {...tagProps}
                      sx={{ m: 0.5 }}
                    />
                  );
                })
              }
              sx={{ width: '100%', mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={handleSubmit}>
              {isEditMode ? 'Update' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Workgroups;
