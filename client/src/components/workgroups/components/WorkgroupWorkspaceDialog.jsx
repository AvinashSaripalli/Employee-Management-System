import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Avatar,
  AvatarGroup,
  Divider,
  TextField,
  Grid,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  ChatBubbleOutline as ChatIcon,
  Edit as EditIcon,
  Groups as GroupsIcon,
  CheckCircleOutline as TaskIcon,
  Campaign as AnnouncementIcon,
  Link as LinkIcon,
  InfoOutlined as InfoIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  PushPin as PinIcon,
  OpenInNew as OpenInNewIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import axios from '../../../api/axios';

const WorkgroupWorkspaceDialog = ({
  open,
  onClose,
  group,
  users = [],
  currentEmployeeId,
  userRole,
  onGroupUpdated,
  onOpenMessenger,
  onEditGroup,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });

  // Members state
  const [memberSearch, setMemberSearch] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedNewEmployees, setSelectedNewEmployees] = useState([]);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    responsibleId: '',
    deadline: '',
    priority: 1,
  });

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Resources state
  const [resources, setResources] = useState([]);
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    type: 'Link',
    description: '',
  });

  const isAdminOrManager = ['Admin', 'Manager'].includes(userRole);
  const isLeader = group?.leaderId === currentEmployeeId;
  const canManage = isAdminOrManager || isLeader;

  useEffect(() => {
    if (group) {
      setAnnouncements(group.announcements || []);
      setResources(group.resources || []);
      fetchWorkgroupTasks();
    }
  }, [group?.id, group?.partnerCompanyName]);

  const fetchWorkgroupTasks = async () => {
    if (!group) return;
    setLoadingTasks(true);
    try {
      const companyName = localStorage.getItem('companyName');
      const response = await axios.get('/tasks', {
        params: { companyName },
      });
      const allTasks = response.data || [];
      const memberIds = new Set((group.employees || []).map((e) => e.employeeId));

      // Filter tasks associated with members of this workgroup
      const groupTasks = allTasks.filter(
        (t) =>
          memberIds.has(t.responsibleId) ||
          memberIds.has(t.createdBy) ||
          (t.members || []).some((m) => memberIds.has(m.userId))
      );
      setTasks(groupTasks);
    } catch (err) {
      console.error('Error fetching tasks for workgroup:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  if (!group) return null;

  const employees = group.employees || [];
  const leaderObj =
    group.leader ||
    employees.find((e) => e.employeeId === group.leaderId) ||
    employees[0];

  // Filtered members
  const filteredMembers = employees.filter((emp) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      (emp.designation && emp.designation.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.email && emp.email.toLowerCase().includes(q))
    );
  });

  // Task stats
  const completedTasks = tasks.filter((t) => t.status === 5).length;
  const inProgressTasks = tasks.filter((t) => t.status === 3).length;
  const pendingTasks = tasks.filter((t) => [1, 2, 4].includes(t.status)).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const displayedTasks = tasks.filter((t) => {
    if (taskFilter === 'completed') return t.status === 5;
    if (taskFilter === 'active') return t.status !== 5;
    return true;
  });

  // Handle Member Role change
  const handleRoleChange = async (targetEmployeeId, newRole) => {
    try {
      await axios.patch(`/workgroups/${group.id}/member-role`, {
        targetEmployeeId,
        role: newRole,
      });
      setFeedback({ message: `Role updated to ${newRole}`, type: 'success' });
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setFeedback({ message: err.response?.data?.error || 'Failed to update role', type: 'error' });
    }
  };

  // Remove Member
  const handleRemoveMember = async (emp) => {
    if (!window.confirm(`Remove ${emp.firstName} ${emp.lastName} from ${group.groupName}?`)) return;
    try {
      const remainingEmployees = employees
        .filter((e) => e.employeeId !== emp.employeeId)
        .map((e) => e.employeeId);

      if (!remainingEmployees.length) {
        setFeedback({ message: 'Cannot remove the last member of the workgroup.', type: 'error' });
        return;
      }

      await axios.put(`/workgroups/${group.id}`, {
        ...group,
        employeers: remainingEmployees,
      });
      setFeedback({ message: 'Member removed successfully', type: 'success' });
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setFeedback({ message: 'Failed to remove member', type: 'error' });
    }
  };

  // Add Members
  const handleAddMembers = async () => {
    if (!selectedNewEmployees.length) return;
    try {
      const currentIds = employees.map((e) => e.employeeId);
      const combined = [...new Set([...currentIds, ...selectedNewEmployees.map((u) => u.employeeId)])];

      await axios.put(`/workgroups/${group.id}`, {
        ...group,
        employeers: combined,
      });
      setAddMemberDialogOpen(false);
      setSelectedNewEmployees([]);
      setFeedback({ message: 'Members added successfully', type: 'success' });
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setFeedback({ message: 'Failed to add members', type: 'error' });
    }
  };

  // Post Announcement
  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    setPostingAnnouncement(true);
    try {
      const res = await axios.post(`/workgroups/${group.id}/announcements`, {
        title: announcementTitle,
        content: announcementContent,
        pinned: announcementPinned,
      });
      setAnnouncements(res.data.announcements || []);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementPinned(false);
      setFeedback({ message: 'Announcement posted to noticeboard', type: 'success' });
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setFeedback({ message: 'Failed to post announcement', type: 'error' });
    } finally {
      setPostingAnnouncement(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      const res = await axios.delete(`/workgroups/${group.id}/announcements/${announcementId}`);
      setAnnouncements(res.data.announcements || []);
      setFeedback({ message: 'Announcement removed', type: 'success' });
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setFeedback({ message: 'Failed to delete announcement', type: 'error' });
    }
  };

  // Add Resource
  const handleAddResource = async () => {
    if (!newResource.title.trim() || !newResource.url.trim()) return;
    try {
      const res = await axios.post(`/workgroups/${group.id}/resources`, newResource);
      setResources(res.data.resources || []);
      setAddResourceOpen(false);
      setNewResource({ title: '', url: '', type: 'Link', description: '' });
      setFeedback({ message: 'Resource added successfully', type: 'success' });
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setFeedback({ message: 'Failed to add resource', type: 'error' });
    }
  };

  // Delete Resource
  const handleDeleteResource = async (resourceId) => {
    try {
      const res = await axios.delete(`/workgroups/${group.id}/resources/${resourceId}`);
      setResources(res.data.resources || []);
      setFeedback({ message: 'Resource removed', type: 'success' });
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setFeedback({ message: 'Failed to remove resource', type: 'error' });
    }
  };

  // Create Task for Group
  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.responsibleId) return;
    try {
      const companyName = localStorage.getItem('companyName');
      await axios.post('/tasks', {
        title: newTask.title,
        description: newTask.description,
        responsibleId: newTask.responsibleId,
        deadline: newTask.deadline || null,
        priority: newTask.priority,
        companyName,
      });
      setCreateTaskOpen(false);
      setNewTask({ title: '', description: '', responsibleId: '', deadline: '', priority: 1 });
      setFeedback({ message: 'Task assigned to workgroup member', type: 'success' });
      fetchWorkgroupTasks();
    } catch (err) {
      setFeedback({ message: 'Failed to create task', type: 'error' });
    }
  };

  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'github':
        return '💻';
      case 'figma':
        return '🎨';
      case 'notion':
        return '📝';
      case 'google drive':
        return '📁';
      case 'jira':
        return '📌';
      default:
        return '🔗';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3.5, minHeight: '640px' } }}>
      {/* Dialog Hero Banner */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: '#FFFFFF',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#FFF' } }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <Chip
            label={group.category || 'Project Pod'}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#FFF', fontWeight: 600, fontSize: '0.72rem' }}
          />
          <Chip
            label={group.privacyType}
            size="small"
            sx={{
              bgcolor: group.privacyType === 'Public' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)',
              color: '#FFF',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          />
          <Chip
            label={group.status || 'Active'}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: '0.72rem' }}
          />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
          {group.groupName || group.partnerCompanyName}
        </Typography>

        {group.partnerCompanyName && group.partnerCompanyName !== group.groupName && (
          <Typography variant="body2" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <BusinessIcon sx={{ fontSize: 16 }} /> Partner / Org: {group.partnerCompanyName}
          </Typography>
        )}

        {/* Quick Action Shortcuts */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
          {onOpenMessenger && (
            <Button
              size="small"
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => {
                onClose();
                onOpenMessenger(group);
              }}
              sx={{
                bgcolor: '#4F46E5',
                '&:hover': { bgcolor: '#4338CA' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Group Chat
            </Button>
          )}

          {canManage && onEditGroup && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                onClose();
                onEditGroup(group);
              }}
              sx={{
                color: '#FFF',
                borderColor: 'rgba(255,255,255,0.4)',
                '&:hover': { borderColor: '#FFF', bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Edit Settings
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs Bar */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC', px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              minHeight: 48,
              py: 0,
            },
          }}
        >
          <Tab icon={<InfoIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
          <Tab
            icon={<GroupsIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Members (${employees.length})`}
          />
          <Tab
            icon={<TaskIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Tasks (${tasks.length})`}
          />
          <Tab
            icon={<AnnouncementIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Noticeboard (${announcements.length})`}
          />
          <Tab
            icon={<LinkIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Resources (${resources.length})`}
          />
        </Tabs>
      </Box>

      {feedback.message && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback({ message: '', type: 'info' })}
          sx={{ m: 2, mb: 0 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Tab Contents */}
      <DialogContent sx={{ p: 3, minHeight: 380, bgcolor: '#F8FAFC' }}>
        {/* TAB 0: OVERVIEW */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Mission / Description */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mission & Objectives
              </Typography>
              <Typography variant="body1" sx={{ color: '#1E293B', lineHeight: 1.6 }}>
                {group.description || 'No detailed description provided. Click "Edit Settings" to add clear mission statements and deliverable goals for this workgroup.'}
              </Typography>
            </Paper>

            {/* Quick KPI stats bar */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
              {[
                { label: 'Team Members', value: employees.length, color: '#4F46E5' },
                { label: 'Active Tasks', value: pendingTasks + inProgressTasks, color: '#0EA5E9' },
                { label: 'Completed Tasks', value: completedTasks, color: '#10B981' },
                { label: 'Completion Rate', value: `${completionRate}%`, color: '#8B5CF6' },
              ].map((s) => (
                <Paper key={s.label} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFF', textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    {s.label}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Leader Highlight Card */}
            {leaderObj && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFF' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Workgroup Leadership
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={leaderObj.photo ? `${leaderObj.photo}` : undefined}
                    sx={{ width: 54, height: 54, bgcolor: '#4F46E5', fontSize: '1.2rem' }}
                  >
                    {leaderObj.firstName?.[0] || 'L'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        {leaderObj.firstName} {leaderObj.lastName}
                      </Typography>
                      <Chip label="Lead Coordinator" size="small" color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {leaderObj.designation || 'Staff'} • {leaderObj.department || 'Operations'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {leaderObj.email}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Tags & Metadata */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tags & Categorization
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {(group.tags || '')
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag, idx) => (
                    <Chip key={idx} label={`#${tag}`} sx={{ bgcolor: '#F1F5F9', fontWeight: 600, color: '#334155' }} />
                  ))}
                {!(group.tags || '').trim() && (
                  <Typography variant="body2" color="text.secondary">
                    No tags specified yet.
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, color: '#64748B', fontSize: '0.85rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 16 }} /> Created on:{' '}
                  <strong>{group.createdOn ? new Date(group.createdOn).toLocaleDateString() : '-'}</strong>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SecurityIcon sx={{ fontSize: 16 }} /> Privacy:{' '}
                  <strong>{group.privacyType}</strong>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* TAB 1: MEMBERS & ROLES */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search team members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 220, bgcolor: '#FFF' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
              />
              {canManage && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddMemberDialogOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Add Members
                </Button>
              )}
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFF', overflow: 'hidden' }}>
              <List disablePadding>
                {filteredMembers.map((emp, index) => {
                  const isEmpLeader = emp.employeeId === group.leaderId;
                  const role = emp.memberRole || (isEmpLeader ? 'Leader' : 'Member');

                  return (
                    <React.Fragment key={emp.employeeId}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ py: 1.8, px: 2.5 }}>
                        <ListItemAvatar>
                          <Avatar
                            src={emp.photo ? `${emp.photo}` : undefined}
                            sx={{ width: 44, height: 44, bgcolor: '#6366F1' }}
                          >
                            {emp.firstName?.[0] || 'M'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                                {emp.firstName} {emp.lastName}
                              </Typography>
                              {emp.employeeId === currentEmployeeId && (
                                <Chip label="You" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {emp.designation || 'Specialist'} • {emp.department || 'Operations'} • {emp.email}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {canManage ? (
                            <Select
                              size="small"
                              value={role}
                              onChange={(e) => handleRoleChange(emp.employeeId, e.target.value)}
                              sx={{
                                height: 32,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                bgcolor: role === 'Leader' ? '#EEF2FF' : '#F8FAFC',
                              }}
                            >
                              <MenuItem value="Leader">Leader</MenuItem>
                              <MenuItem value="Co-Lead">Co-Lead</MenuItem>
                              <MenuItem value="Moderator">Moderator</MenuItem>
                              <MenuItem value="Member">Member</MenuItem>
                            </Select>
                          ) : (
                            <Chip
                              label={role}
                              size="small"
                              color={role === 'Leader' ? 'primary' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                            />
                          )}

                          {canManage && employees.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveMember(emp)}
                              title="Remove from workgroup"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            </Paper>
          </Box>
        )}

        {/* TAB 2: TASKS */}
        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Task Progress header */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFF' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Team Task Progress ({completedTasks}/{tasks.length} Completed)
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4F46E5' }}>
                  {completionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRate}
                sx={{ height: 8, borderRadius: 4, bgcolor: '#EEF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#4F46E5', borderRadius: 4 } }}
              />
            </Paper>

            {/* Filter & Add Task buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['all', 'active', 'completed'].map((f) => (
                  <Chip
                    key={f}
                    label={f.toUpperCase()}
                    clickable
                    color={taskFilter === f ? 'primary' : 'default'}
                    variant={taskFilter === f ? 'filled' : 'outlined'}
                    size="small"
                    onClick={() => setTaskFilter(f)}
                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                  />
                ))}
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setCreateTaskOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Create Task for Group
              </Button>
            </Box>

            {loadingTasks ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : displayedTasks.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {displayedTasks.map((t) => (
                  <Paper
                    key={t.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
                        {t.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Due: {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}</span>
                        <span>•</span>
                        <span>Responsible: {t.responsible ? `${t.responsible.firstName} ${t.responsible.lastName}` : 'Unassigned'}</span>
                      </Typography>
                    </Box>

                    <Chip
                      label={t.statusName || (t.status === 5 ? 'Completed' : 'In Progress')}
                      size="small"
                      color={t.status === 5 ? 'success' : 'primary'}
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </Paper>
                ))}
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1', bgcolor: '#FFF' }}>
                <AssignmentIcon sx={{ fontSize: 36, color: '#94A3B8', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No tasks found matching current filter for this workgroup.
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* TAB 3: ANNOUNCEMENTS & NOTICEBOARD */}
        {activeTab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Post Announcement Form */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5 }}>
                Post Team Notice or Update
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Headline / Title"
                placeholder="e.g. Q3 Sprint Kickoff, Client Review Feedback"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Content & Details"
                placeholder="Share key updates, action items, or meeting notes..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={announcementPinned}
                      onChange={(e) => setAnnouncementPinned(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Pin to top</Typography>}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePostAnnouncement}
                  disabled={postingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {postingAnnouncement ? 'Posting...' : 'Post Notice'}
                </Button>
              </Box>
            </Paper>

            {/* List of Announcements */}
            {announcements.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {announcements.map((post) => (
                  <Paper
                    key={post.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: post.pinned ? '2px solid #818CF8' : '1px solid #E2E8F0',
                      bgcolor: post.pinned ? '#FAF5FF' : '#FFF',
                      position: 'relative',
                    }}
                  >
                    {post.pinned && (
                      <Chip
                        icon={<PinIcon sx={{ fontSize: '13px !important', color: '#9333EA !important' }} />}
                        label="Pinned Notice"
                        size="small"
                        sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#F3E8FF', color: '#7E22CE', fontWeight: 700, fontSize: '0.68rem' }}
                      />
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                      <Avatar src={post.authorPhoto || undefined} sx={{ width: 32, height: 32, bgcolor: '#4F46E5', fontSize: '0.8rem' }}>
                        {post.authorName?.[0] || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                          {post.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(post.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {post.content}
                    </Typography>

                    {(canManage || post.authorId === currentEmployeeId) && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAnnouncement(post.id)}
                          title="Delete notice"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1', bgcolor: '#FFF' }}>
                <AnnouncementIcon sx={{ fontSize: 36, color: '#94A3B8', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No announcements yet. Post the first update to keep your team aligned!
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* TAB 4: SHARED RESOURCES & LINKS */}
        {activeTab === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Shared Documents, Design & Repositories
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddResourceOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Add Resource
              </Button>
            </Box>

            {resources.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                {resources.map((item) => (
                  <Paper
                    key={item.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFF',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: '#4F46E5',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.08)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0,
                        }}
                      >
                        {getResourceIcon(item.type)}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }} noWrap>
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.type || 'Link'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F8FAFC', color: '#64748B', mt: 0.3 }}
                        />
                      </Box>
                      {canManage && (
                        <IconButton size="small" color="error" onClick={() => handleDeleteResource(item.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {item.description && (
                      <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', mb: 1.5 }}>
                        {item.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1, borderTop: '1px solid #F1F5F9' }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                        Added by {item.addedByName || 'Team member'}
                      </Typography>
                      <Button
                        size="small"
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        Open
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1', bgcolor: '#FFF' }}>
                <LinkIcon sx={{ fontSize: 36, color: '#94A3B8', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No shared resources or links yet. Connect team Figma boards, repositories, or Google Drive folders.
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#FFF', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Close Workspace
        </Button>
      </DialogActions>

      {/* Sub-Dialog: Add Members */}
      <Dialog open={addMemberDialogOpen} onClose={() => setAddMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Members to {group.groupName}</DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            multiple
            options={users.filter((u) => !employees.some((e) => e.employeeId === u.employeeId))}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.designation || 'Staff'})`}
            value={selectedNewEmployees}
            onChange={(e, val) => setSelectedNewEmployees(val)}
            renderInput={(params) => <TextField {...params} placeholder="Select colleagues to add..." label="Select Employees" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMembers} disabled={!selectedNewEmployees.length}>
            Add to Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-Dialog: Add Resource */}
      <Dialog open={addResourceOpen} onClose={() => setAddResourceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Shared Link / Resource</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Resource Title"
            placeholder="e.g. Design Specs, Code Repository"
            fullWidth
            value={newResource.title}
            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
          />
          <TextField
            label="URL / Link"
            placeholder="https://..."
            fullWidth
            value={newResource.url}
            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={newResource.type}
              label="Type"
              onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
            >
              <MenuItem value="GitHub">GitHub / Code</MenuItem>
              <MenuItem value="Figma">Figma / Design</MenuItem>
              <MenuItem value="Notion">Notion / Wiki</MenuItem>
              <MenuItem value="Google Drive">Google Drive / Files</MenuItem>
              <MenuItem value="Jira">Jira / Backlog</MenuItem>
              <MenuItem value="Documentation">Documentation</MenuItem>
              <MenuItem value="Link">General Link</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={newResource.description}
            onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddResourceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddResource} disabled={!newResource.title.trim() || !newResource.url.trim()}>
            Save Resource
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-Dialog: Create Task */}
      <Dialog open={createTaskOpen} onClose={() => setCreateTaskOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Task for Workgroup</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Task Title"
            fullWidth
            required
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <FormControl fullWidth required>
            <InputLabel>Assign Responsible Member</InputLabel>
            <Select
              value={newTask.responsibleId}
              label="Assign Responsible Member"
              onChange={(e) => setNewTask({ ...newTask, responsibleId: e.target.value })}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Deadline"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={newTask.deadline}
            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTask.priority}
              label="Priority"
              onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
            >
              <MenuItem value={0}>Low</MenuItem>
              <MenuItem value={1}>Normal</MenuItem>
              <MenuItem value={2}>High</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTaskOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTask} disabled={!newTask.title.trim() || !newTask.responsibleId}>
            Assign Task
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default WorkgroupWorkspaceDialog;
