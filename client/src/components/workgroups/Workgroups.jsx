import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  GridView as GridViewIcon,
  ViewList as TableViewIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  PersonPin as MyGroupsIcon,
} from '@mui/icons-material';
import axios from '../../api/axios';
import WorkgroupStatsBar from './components/WorkgroupStatsBar';
import WorkgroupCard from './components/WorkgroupCard';
import WorkgroupTable from './components/WorkgroupTable';
import WorkgroupWorkspaceDialog from './components/WorkgroupWorkspaceDialog';
import WorkgroupFormDialog from './components/WorkgroupFormDialog';

const Workgroups = () => {
  const [rawWorkgroups, setRawWorkgroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });

  // View & Filter state
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [privacyFilter, setPrivacyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [onlyMyGroups, setOnlyMyGroups] = useState(false);

  // Dialogs state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGroupToEdit, setSelectedGroupToEdit] = useState(null);

  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [activeWorkspaceGroup, setActiveWorkspaceGroup] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentEmployeeId = localStorage.getItem('userEmployeeId') || '';
  const userRole = localStorage.getItem('userRole') || 'Employee';
  const isAdminOrManager = ['Admin', 'Manager'].includes(userRole);

  const fetchWorkGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const companyName = localStorage.getItem('companyName');

      const response = await axios.get('/workgroups', {
        headers: { Authorization: `Bearer ${token}` },
        params: { companyName },
      });
      setRawWorkgroups(response.data || []);
    } catch (error) {
      console.error('Error fetching workgroups:', error);
      setFeedback({
        open: true,
        message: 'Unable to load workgroups. Please refresh and try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
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
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchWorkGroups();
    fetchUsers();
  }, []);

  // Aggregate raw rows into distinct workgroup entities
  const groupedData = useMemo(() => {
    const map = new Map();

    (rawWorkgroups || []).forEach((row) => {
      const groupKey = row.partnerCompanyName || `group-${row.id}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          id: row.id,
          companyName: row.companyName,
          groupName: row.groupName || row.partnerCompanyName,
          partnerCompanyName: row.partnerCompanyName,
          description: row.description || '',
          category: row.category || 'Project Pod',
          status: row.status || 'Active',
          privacyType: row.privacyType || 'Private',
          leaderId: row.leaderId || null,
          leader: row.leader || null,
          tags: row.tags || '',
          resources: Array.isArray(row.resources) ? row.resources : [],
          announcements: Array.isArray(row.announcements) ? row.announcements : [],
          createdOn: row.createdOn,
          employeesMap: new Map(),
        });
      }

      const grp = map.get(groupKey);

      if (row.employeeId && !grp.employeesMap.has(row.employeeId)) {
        grp.employeesMap.set(row.employeeId, {
          employeeId: row.employeeId,
          firstName: row.firstName || '',
          lastName: row.lastName || '',
          email: row.email || '',
          designation: row.designation || '',
          department: row.department || '',
          technicalSkills: row.technicalSkills || '',
          photo: row.photo || null,
          phoneNumber: row.phoneNumber || '',
          memberRole: row.memberRole || (row.employeeId === grp.leaderId ? 'Leader' : 'Member'),
        });
      }
    });

    return Array.from(map.values()).map((g) => ({
      ...g,
      employees: Array.from(g.employeesMap.values()),
    }));
  }, [rawWorkgroups]);

  // Apply filters & search
  const visibleGroups = useMemo(() => {
    return groupedData.filter((group) => {
      // Search
      const q = searchValue.trim().toLowerCase();
      if (q) {
        const matchesName =
          (group.groupName && group.groupName.toLowerCase().includes(q)) ||
          (group.partnerCompanyName && group.partnerCompanyName.toLowerCase().includes(q));
        const matchesTags = group.tags && group.tags.toLowerCase().includes(q);
        const matchesDesc = group.description && group.description.toLowerCase().includes(q);
        const matchesLeader =
          group.leader &&
          `${group.leader.firstName} ${group.leader.lastName}`.toLowerCase().includes(q);
        const matchesMember = (group.employees || []).some((emp) =>
          `${emp.firstName} ${emp.lastName} ${emp.employeeId}`.toLowerCase().includes(q)
        );

        if (!matchesName && !matchesTags && !matchesDesc && !matchesLeader && !matchesMember) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'All' && group.category !== categoryFilter) {
        return false;
      }

      // Privacy filter
      if (privacyFilter !== 'All' && group.privacyType !== privacyFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && group.status !== statusFilter) {
        return false;
      }

      // My Groups filter
      if (onlyMyGroups) {
        const isMember = (group.employees || []).some((e) => e.employeeId === currentEmployeeId);
        if (!isMember) return false;
      }

      return true;
    });
  }, [groupedData, searchValue, categoryFilter, privacyFilter, statusFilter, onlyMyGroups, currentEmployeeId]);

  // Form Submit (Create / Edit)
  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (isEditMode && selectedGroupToEdit) {
        await axios.put(`/workgroups/${selectedGroupToEdit.id}`, formData, { headers });
        setFeedback({ open: true, message: 'Workgroup updated successfully.', severity: 'success' });
      } else {
        await axios.post('/workgroups/', formData, { headers });
        setFeedback({ open: true, message: 'Workgroup created successfully.', severity: 'success' });
      }

      setFormDialogOpen(false);
      setIsEditMode(false);
      setSelectedGroupToEdit(null);
      fetchWorkGroups();
    } catch (error) {
      console.error('Error saving workgroup:', error);
      setFeedback({
        open: true,
        message: error.response?.data?.error || 'Unable to save workgroup.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Workgroup
  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/workgroups/${deleteTarget.id}`);
      setDeleteTarget(null);
      setFeedback({ open: true, message: 'Workgroup deleted successfully.', severity: 'success' });
      fetchWorkGroups();
      if (activeWorkspaceGroup?.id === deleteTarget.id) {
        setWorkspaceDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting workgroup:', error);
      setFeedback({ open: true, message: 'Unable to delete this workgroup.', severity: 'error' });
    }
  };

  // Self-service Join
  const handleJoinGroup = async (group) => {
    try {
      await axios.post(`/workgroups/${group.id}/join`);
      setFeedback({ open: true, message: `Joined ${group.groupName}!`, severity: 'success' });
      fetchWorkGroups();
    } catch (error) {
      setFeedback({
        open: true,
        message: error.response?.data?.error || 'Failed to join workgroup',
        severity: 'error',
      });
    }
  };

  // Self-service Leave
  const handleLeaveGroup = async (group) => {
    if (!window.confirm(`Are you sure you want to leave ${group.groupName}?`)) return;
    try {
      await axios.post(`/workgroups/${group.id}/leave`);
      setFeedback({ open: true, message: `Left ${group.groupName}.`, severity: 'success' });
      fetchWorkGroups();
    } catch (error) {
      setFeedback({
        open: true,
        message: error.response?.data?.error || 'Failed to leave workgroup',
        severity: 'error',
      });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!visibleGroups.length) return;

    const headers = ['ID', 'Group Name', 'Partner Company', 'Category', 'Privacy', 'Status', 'Leader ID', 'Members Count', 'Created Date'];
    const rows = visibleGroups.map((g) => [
      g.id,
      `"${(g.groupName || '').replace(/"/g, '""')}"`,
      `"${(g.partnerCompanyName || '').replace(/"/g, '""')}"`,
      g.category,
      g.privacyType,
      g.status,
      g.leaderId || 'N/A',
      g.employees?.length || 0,
      g.createdOn ? new Date(g.createdOn).toISOString().slice(0, 10) : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workgroups_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Workspace
  const handleOpenWorkspace = (group) => {
    setActiveWorkspaceGroup(group);
    setWorkspaceDialogOpen(true);
  };

  // Edit Action
  const handleEditGroup = (group) => {
    setSelectedGroupToEdit(group);
    setIsEditMode(true);
    setFormDialogOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Header Banner */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            Work Groups & Collaboration Hub
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>
            Coordinate cross-functional pods, partner channels, task forces, and team initiatives.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={!visibleGroups.length}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#FFF',
              borderColor: '#CBD5E1',
              color: '#334155',
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
            }}
          >
            Export CSV
          </Button>

          {isAdminOrManager && (
            <Button
              variant="contained"
              size="medium"
              startIcon={<AddIcon />}
              onClick={() => {
                setIsEditMode(false);
                setSelectedGroupToEdit(null);
                setFormDialogOpen(true);
              }}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              }}
            >
              New Workgroup
            </Button>
          )}
        </Box>
      </Box>

      {/* KPI Stats Bar */}
      <WorkgroupStatsBar workgroups={groupedData} />

      {/* Search & Filter Toolbar */}
      <Box
        sx={{
          p: 2,
          mb: 3,
          bgcolor: '#FFFFFF',
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        {/* Search input */}
        <TextField
          size="small"
          placeholder="Search by name, partner, tags, or team member..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          sx={{ flex: 1, minWidth: { xs: '100%', md: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94A3B8' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value="Project Pod">Project Pod</MenuItem>
              <MenuItem value="Client/Partner">Client/Partner</MenuItem>
              <MenuItem value="Cross-Functional">Cross-Functional</MenuItem>
              <MenuItem value="Innovation Lab">Innovation Lab</MenuItem>
              <MenuItem value="Department">Department</MenuItem>
              <MenuItem value="Committee">Committee</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Privacy</InputLabel>
            <Select
              value={privacyFilter}
              label="Privacy"
              onChange={(e) => setPrivacyFilter(e.target.value)}
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="Public">Public Only</MenuItem>
              <MenuItem value="Private">Private Only</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </Select>
          </FormControl>

          <Chip
            icon={<MyGroupsIcon sx={{ fontSize: '16px !important' }} />}
            label="My Groups"
            clickable
            color={onlyMyGroups ? 'primary' : 'default'}
            variant={onlyMyGroups ? 'filled' : 'outlined'}
            onClick={() => setOnlyMyGroups(!onlyMyGroups)}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          />

          <IconButton
            onClick={fetchWorkGroups}
            aria-label="Refresh"
            sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
            sx={{ bgcolor: '#F8FAFC', borderRadius: 2 }}
          >
            <ToggleButton value="cards" aria-label="cards view">
              <Tooltip title="Card View">
                <GridViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <Tooltip title="Table View">
                <TableViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Main Content Area */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress size={42} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading workgroups hub...
          </Typography>
        </Box>
      ) : visibleGroups.length > 0 ? (
        viewMode === 'cards' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2.5,
            }}
          >
            {visibleGroups.map((group) => (
              <WorkgroupCard
                key={group.id}
                group={group}
                currentEmployeeId={currentEmployeeId}
                userRole={userRole}
                onOpenWorkspace={handleOpenWorkspace}
                onEdit={handleEditGroup}
                onDelete={(g) => setDeleteTarget(g)}
                onJoin={handleJoinGroup}
                onLeave={handleLeaveGroup}
                onChat={handleOpenWorkspace}
              />
            ))}
          </Box>
        ) : (
          <WorkgroupTable
            workgroups={visibleGroups}
            currentEmployeeId={currentEmployeeId}
            userRole={userRole}
            onOpenWorkspace={handleOpenWorkspace}
            onEdit={handleEditGroup}
            onDelete={(g) => setDeleteTarget(g)}
            onJoin={handleJoinGroup}
            onLeave={handleLeaveGroup}
            onChat={handleOpenWorkspace}
          />
        )
      ) : (
        <Box
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: '#FFF',
            borderRadius: 3,
            border: '1px dashed #CBD5E1',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
            {searchValue || categoryFilter !== 'All' || onlyMyGroups
              ? 'No workgroups match your filters.'
              : 'No workgroups found.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchValue || categoryFilter !== 'All' || onlyMyGroups
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Create the first workgroup to start collaborating seamlessly across teams.'}
          </Typography>
          {isAdminOrManager && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setIsEditMode(false);
                setSelectedGroupToEdit(null);
                setFormDialogOpen(true);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Create First Workgroup
            </Button>
          )}
        </Box>
      )}

      {/* Deep-Dive Workspace Dialog */}
      {workspaceDialogOpen && activeWorkspaceGroup && (
        <WorkgroupWorkspaceDialog
          open={workspaceDialogOpen}
          onClose={() => setWorkspaceDialogOpen(false)}
          group={
            groupedData.find((g) => g.id === activeWorkspaceGroup.id) || activeWorkspaceGroup
          }
          users={users}
          currentEmployeeId={currentEmployeeId}
          userRole={userRole}
          onGroupUpdated={fetchWorkGroups}
          onEditGroup={handleEditGroup}
        />
      )}

      {/* Create / Edit Form Dialog */}
      <WorkgroupFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setIsEditMode(false);
          setSelectedGroupToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        isEditMode={isEditMode}
        initialData={selectedGroupToEdit}
        users={users}
        saving={saving}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Workgroup?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{deleteTarget?.groupName || deleteTarget?.partnerCompanyName}</strong>?
            This will remove all member assignments and resources for this workgroup.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteGroup}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Toast */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={3000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback({ ...feedback, open: false })}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Workgroups;
