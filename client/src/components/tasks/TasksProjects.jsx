import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid, TextField, MenuItem, Select, FormControl,
  InputLabel, IconButton, LinearProgress, Checkbox, Tooltip, Tab, Tabs,
  Autocomplete as MUIAutocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  DeleteOutline as DeleteOutlineIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from '../../api/axios';

const STATUS_META = {
  1: { label: 'New', color: 'default' },
  2: { label: 'Pending', color: 'info' },
  3: { label: 'In Progress', color: 'warning' },
  4: { label: 'Review', color: 'secondary' },
  5: { label: 'Completed', color: 'success' },
  6: { label: 'Deferred', color: 'default' },
  7: { label: 'Declined', color: 'error' },
};

const PRIORITY_META = {
  0: { label: 'Low', color: 'default' },
  1: { label: 'Normal', color: 'info' },
  2: { label: 'High', color: 'error' },
};

const STATUS_ACTIONS = {
  1: ['accept', 'start', 'defer', 'deny'],
  2: ['start', 'complete', 'defer', 'deny'],
  3: ['pause', 'complete', 'defer', 'deny'],
  4: ['approve', 'disapprove'],
  5: [],
  6: ['renew'],
  7: [],
};

const ACTION_LABELS = {
  accept: 'Accept',
  start: 'Start',
  pause: 'Pause',
  complete: 'Complete',
  approve: 'Approve',
  disapprove: 'Disapprove',
  defer: 'Defer',
  renew: 'Renew',
  deny: 'Deny',
};

const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  responsibleId: 'Assignee',
  deadline: 'Deadline',
  priority: 'Priority',
  parentId: 'Parent task',
  taskControl: 'Creator approval',
};

const describeActivity = (a, userList = []) => {
  const userName = (id) => {
    const found = userList.find((u) => u.employeeId === id);
    return found ? `${found.firstName} ${found.lastName}` : id;
  };

  switch (a.action) {
    case 'create':
      return 'created this task';
    case 'status':
      return `changed status from "${a.oldValue || '—'}" to "${a.newValue}"`;
    case 'update': {
      const label = FIELD_LABELS[a.field] || a.field;
      if (a.oldValue && a.newValue) return `updated ${label} from "${a.oldValue}" to "${a.newValue}"`;
      if (a.newValue) return `set ${label} to "${a.newValue}"`;
      if (a.oldValue) return `cleared ${label} ("${a.oldValue}")`;
      return `updated ${label}`;
    }
    case 'checklist_add':
      return `added checklist item "${a.newValue}"`;
    case 'checklist_update':
      return `renamed checklist item "${a.oldValue}" to "${a.newValue}"`;
    case 'checklist_toggle':
      return a.newValue === 'Complete'
        ? `completed checklist item "${a.field}"`
        : `reopened checklist item "${a.field}"`;
    case 'checklist_delete':
      return `removed checklist item "${a.oldValue}"`;
    case 'member_add':
      return `added ${a.field}: ${userName(a.newValue)}`;
    case 'member_remove':
      return `removed ${a.field}: ${userName(a.oldValue)}`;
    case 'delete':
      return 'deleted this task';
    default:
      return a.action;
  }
};

const initialState = {
  title: '',
  description: '',
  responsibleId: '',
  priority: 1,
  deadline: '',
  parentId: '',
  taskControl: false,
  checklist: [],
  accomplishers: [],
  observers: [],
};

const TasksProjects = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [formData, setFormData] = useState(initialState);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [viewTask, setViewTask] = useState(null);
  const [viewChecklistInput, setViewChecklistInput] = useState('');
  const [viewTab, setViewTab] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [teamAddType, setTeamAddType] = useState('A');
  const [teamAddUser, setTeamAddUser] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [tab, setTab] = useState(0);

  const currentEmployeeId = localStorage.getItem('userEmployeeId') || '';
  const currentRole = localStorage.getItem('userRole') || '';
  const companyName = localStorage.getItem('companyName') || '';

  const canAct = useCallback(
    (task) => {
      const isAdmin = currentRole === 'Admin' || currentRole === 'Manager';
      const isCreator = task.createdBy === currentEmployeeId;
      const isResponsible = task.responsibleId === currentEmployeeId;
      return isAdmin || isCreator || isResponsible;
    },
    [currentEmployeeId, currentRole]
  );

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { companyName };
      if (filter !== 'all') params.status = filter;
      if (myTasksOnly) params.myTasks = 'true';
      const response = await axios.get('/tasks', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [companyName, filter, myTasksOnly]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/users/employees', {
        headers: { Authorization: `Bearer ${token}` },
        params: { companyName },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [companyName]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (openForm) {
      fetchUsers();
    }
  }, [openForm, fetchUsers]);

  const resetForm = () => {
    setFormData(initialState);
    setIsEditMode(false);
    setSelectedTaskId(null);
    setNewChecklistItem('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const handleEdit = (task) => {
    setIsEditMode(true);
    setSelectedTaskId(task.id);
    const members = task.members || [];
    setFormData({
      title: task.title,
      description: task.description || '',
      responsibleId: task.responsibleId || '',
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      parentId: task.parentId ? String(task.parentId) : '',
      taskControl: task.taskControl,
      checklist: task.checklist ? task.checklist.map((c) => c.title) : [],
      accomplishers: members.filter((m) => m.type === 'A').map((m) => m.userId),
      observers: members.filter((m) => m.type === 'U').map((m) => m.userId),
    });
    setOpenForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    if (!formData.responsibleId) return;
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        deadline: formData.deadline || null,
        parentId: formData.parentId || null,
        members: [
          ...formData.accomplishers.map((userId) => ({ userId, type: 'A' })),
          ...formData.observers.map((userId) => ({ userId, type: 'U' })),
        ],
      };
      if (isEditMode) {
        await axios.put(`/tasks/${selectedTaskId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('/tasks', { ...payload, companyName }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setOpenForm(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} task:`, error);
      alert(error.response?.data?.error || 'Something went wrong');
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusAction = async (task, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/tasks/${task.id}/status`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (viewTask && viewTask.id === task.id) {
        setViewTask(response.data);
        fetchActivities(task.id);
      }
      fetchTasks();
    } catch (error) {
      console.error('Error changing task status:', error);
      alert(error.response?.data?.error || 'Something went wrong');
    }
  };

  const fetchActivities = useCallback(async (taskId) => {
    setLoadingActivities(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/tasks/${taskId}/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching task activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const refreshViewTask = useCallback(async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewTask(response.data);
      fetchActivities(taskId);
    } catch (error) {
      console.error('Error refreshing task:', error);
    }
  }, [fetchActivities]);

  const handleAddMember = async () => {
    if (!viewTask || !teamAddUser) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/tasks/${viewTask.id}/members`,
        { type: teamAddType, userId: teamAddUser },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeamAddUser('');
      refreshViewTask(viewTask.id);
      fetchTasks();
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.error || 'Something went wrong');
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/tasks/members/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (member.userId === currentEmployeeId) {
        setTeamAddUser('');
      }
      refreshViewTask(viewTask.id);
      fetchTasks();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleView = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewTask(response.data);
      setViewChecklistInput('');
      setViewTab(0);
      fetchActivities(task.id);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const handleAddChecklist = async (inForm = false) => {
    if (inForm) {
      const title = newChecklistItem.trim();
      if (!title) return;
      setFormData((prev) => ({ ...prev, checklist: [...prev.checklist, title] }));
      setNewChecklistItem('');
      return;
    }
    const title = viewChecklistInput.trim();
    if (!title || !viewTask) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/tasks/${viewTask.id}/checklist`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewTask((prev) => ({
        ...prev,
        checklist: [...prev.checklist, response.data],
      }));
      setViewChecklistInput('');
      fetchActivities(viewTask.id);
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const handleToggleChecklist = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/tasks/checklist/${item.id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewTask((prev) => ({
        ...prev,
        checklist: prev.checklist.map((c) => (c.id === item.id ? response.data : c)),
      }));
      fetchActivities(viewTask.id);
    } catch (error) {
      console.error('Error toggling checklist item:', error);
    }
  };

  const handleDeleteChecklist = async (item) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/tasks/checklist/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewTask((prev) => ({
        ...prev,
        checklist: prev.checklist.filter((c) => c.id !== item.id),
      }));
      fetchActivities(viewTask.id);
    } catch (error) {
      console.error('Error deleting checklist item:', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      (task.responsible && `${task.responsible.firstName} ${task.responsible.lastName}`.toLowerCase().includes(q)) ||
      (task.responsibleId || '').toLowerCase().includes(q)
    );
  });

  const progress = (checklist) => {
    if (!checklist || checklist.length === 0) return { done: 0, total: 0, pct: 0 };
    const total = checklist.length;
    const done = checklist.filter((c) => c.isComplete).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  };

  return (
    <Box sx={{ pl: 6, pr: 6, mt: '50px' }}>
      <Grid container spacing={3} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
          Tasks &amp; Projects
        </Typography>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Add Task
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2, boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 12px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'gray' }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <MenuItem key={value} value={value}>{meta.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl component="fieldset">
              <label>
                <Checkbox checked={myTasksOnly} onChange={(e) => setMyTasksOnly(e.target.checked)} />
                <span>My tasks only</span>
              </label>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          maxHeight: '462px',
          overflowY: 'auto',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 12px',
        }}
      >
        <Table stickyHeader aria-label="tasks table">
          <TableHead sx={{ backgroundColor: '#f4f7fe' }}>
            <TableRow>
              <TableCell align="left" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Task
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Assignee
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Priority
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Deadline
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Status
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Progress
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const p = progress(task.checklist);
                const statusMeta = STATUS_META[task.status] || STATUS_META[2];
                const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META[1];
                return (
                  <TableRow key={task.id} hover>
                    <TableCell align="left">
                      <Tooltip title={task.description || ''}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {task.title}
                        </Typography>
                      </Tooltip>
                      {task.subtaskCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {task.subtaskCount} subtask{task.subtaskCount > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Avatar
                          src={task.responsible?.photo || undefined}
                          alt={`${task.responsible?.firstName || ''} ${task.responsible?.lastName || ''}`}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2">
                            {task.responsible
                              ? `${task.responsible.firstName} ${task.responsible.lastName}`
                              : task.responsibleId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.responsibleId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={priorityMeta.label} color={priorityMeta.color} />
                    </TableCell>
                    <TableCell align="center">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString('en-GB')
                        : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={statusMeta.label}
                        color={statusMeta.color}
                        variant={task.status === 5 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {p.total > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={p.pct}
                            sx={{ width: 80, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">
                            {p.done}/{p.total}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(task)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(task)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(task)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Task Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {isEditMode ? 'Edit Task' : 'Add Task'}
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Details" />
            <Tab label="Checklist" />
            <Tab label="Team" />
          </Tabs>

          {tab === 0 && (
            <Box>
              <TextField
                fullWidth
                margin="normal"
                label="Task Title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
              <Autocomplete
                users={users}
                value={formData.responsibleId}
                onChange={(employeeId) => setFormData((prev) => ({ ...prev, responsibleId: employeeId }))}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      label="Priority"
                      value={formData.priority}
                      onChange={(e) => setFormData((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                    >
                      <MenuItem value={0}>Low</MenuItem>
                      <MenuItem value={1}>Normal</MenuItem>
                      <MenuItem value={2}>High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Deadline"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </Grid>
              </Grid>
              <FormControl fullWidth margin="normal">
                <InputLabel>Parent Task (Subtask)</InputLabel>
                <Select
                  label="Parent Task (Subtask)"
                  value={formData.parentId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {tasks
                    .filter((t) => t.id !== selectedTaskId)
                    .map((t) => (
                      <MenuItem key={t.id} value={String(t.id)}>{t.title}</MenuItem>
                    ))}
                </Select>
              </FormControl>
              <label>
                <Checkbox
                  checked={formData.taskControl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taskControl: e.target.checked }))}
                />
                <span>Require creator approval to complete</span>
              </label>
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="New checklist item"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklist(true); }}
                />
                <Button variant="contained" size="small" onClick={() => handleAddChecklist(true)}>
                  Add
                </Button>
              </Box>
              {formData.checklist.map((item, idx) => (
                <Box key={`${item}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AddCircleOutlineIcon sx={{ color: 'gray' }} />
                  <Typography sx={{ flexGrow: 1 }}>{item}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      checklist: prev.checklist.filter((_, i) => i !== idx),
                    }))}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {formData.checklist.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No checklist items added yet.
                </Typography>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Accomplishers <Typography component="span" variant="caption" color="text.secondary">(help complete the task)</Typography>
              </Typography>
              <MemberAdder
                users={users}
                selected={formData.accomplishers}
                onAdd={(userId) => setFormData((prev) => ({
                  ...prev,
                  accomplishers: prev.accomplishers.includes(userId)
                    ? prev.accomplishers
                    : [...prev.accomplishers, userId],
                }))}
                onRemove={(userId) => setFormData((prev) => ({
                  ...prev,
                  accomplishers: prev.accomplishers.filter((id) => id !== userId),
                }))}
              />

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Observers <Typography component="span" variant="caption" color="text.secondary">(get notified / track)</Typography>
                </Typography>
                <MemberAdder
                  users={users}
                  selected={formData.observers}
                  onAdd={(userId) => setFormData((prev) => ({
                    ...prev,
                    observers: prev.observers.includes(userId)
                      ? prev.observers
                      : [...prev.observers, userId],
                  }))}
                  onRemove={(userId) => setFormData((prev) => ({
                    ...prev,
                    observers: prev.observers.filter((id) => id !== userId),
                  }))}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={Boolean(viewTask)} onClose={() => setViewTask(null)} fullWidth maxWidth="sm">
        {viewTask && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">{viewTask.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {viewTask.id} • Created by:{' '}
                    {viewTask.creator ? `${viewTask.creator.firstName} ${viewTask.creator.lastName}` : viewTask.createdBy}
                  </Typography>
                </Box>
                <IconButton onClick={() => setViewTask(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <Tabs value={viewTab} onChange={(e, v) => setViewTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Overview" />
              <Tab label={`Activity${activities.length > 0 ? ` (${activities.length})` : ''}`} />
            </Tabs>
            <DialogContent dividers>
              {viewTab === 0 ? (
                <>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip size="small" label={(STATUS_META[viewTask.status] || STATUS_META[2]).label}
                      color={(STATUS_META[viewTask.status] || STATUS_META[2]).color} />
                    <Chip size="small" label={(PRIORITY_META[viewTask.priority] || PRIORITY_META[1]).label}
                      color={(PRIORITY_META[viewTask.priority] || PRIORITY_META[1]).color} />
                    {viewTask.deadline && (
                      <Chip size="small" label={`Deadline: ${new Date(viewTask.deadline).toLocaleDateString('en-GB')}`} />
                    )}
                    {viewTask.taskControl && (
                      <Chip size="small" label="Creator approval required" color="secondary" variant="outlined" />
                    )}
                  </Box>

                  {viewTask.description && (
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {viewTask.description}
                    </Typography>
                  )}

                  <Box sx={{ mt: 3, mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                      Team
                    </Typography>

                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                      Responsible
                    </Typography>
                    {viewTask.responsible ? (
                      <MemberChip
                        photo={viewTask.responsible.photo}
                        name={`${viewTask.responsible.firstName} ${viewTask.responsible.lastName}`}
                        subtitle={viewTask.responsibleId}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}

                    <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 0.5, color: 'text.secondary' }}>
                      Creator
                    </Typography>
                    {viewTask.creator ? (
                      <MemberChip
                        photo={viewTask.creator.photo}
                        name={`${viewTask.creator.firstName} ${viewTask.creator.lastName}`}
                        subtitle={viewTask.createdBy}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}

                    {(['A', 'U']).map((type) => {
                      const members = (viewTask.members || []).filter((m) => m.type === type);
                      return (
                        <Box key={type} sx={{ mt: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                            {type === 'A' ? 'Accomplishers' : 'Observers'}
                          </Typography>
                          {members.length > 0 ? (
                            members.map((m) => (
                              <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <MemberChip
                                  photo={m.user?.photo}
                                  name={m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId}
                                  subtitle={m.userId}
                                />
                                {canAct(viewTask) && (
                                  <Tooltip title="Remove member">
                                    <IconButton size="small" onClick={() => handleRemoveMember(m)}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">None</Typography>
                          )}
                        </Box>
                      );
                    })}

                    {canAct(viewTask) && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Role</InputLabel>
                          <Select
                            label="Role"
                            value={teamAddType}
                            onChange={(e) => setTeamAddType(e.target.value)}
                          >
                            <MenuItem value="A">Accomplisher</MenuItem>
                            <MenuItem value="U">Observer</MenuItem>
                          </Select>
                        </FormControl>
                        <MUIAutocomplete
                          size="small"
                          sx={{ flexGrow: 1 }}
                          options={users.filter(
                            (u) => !(viewTask.members || []).some((m) =>
                              m.type === teamAddType && m.userId === u.employeeId
                            ) && u.employeeId !== viewTask.responsibleId && u.employeeId !== viewTask.createdBy
                          )}
                          getOptionLabel={(u) => `${u.firstName} ${u.lastName} (${u.employeeId})`}
                          value={users.find((u) => u.employeeId === teamAddUser) || null}
                          onChange={(e, val) => setTeamAddUser(val ? val.employeeId : '')}
                          renderInput={(params) => <TextField {...params} label="Add member" placeholder="Search employee..." />}
                        />
                        <Button variant="contained" size="small" onClick={handleAddMember} disabled={!teamAddUser}>
                          Add
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Checklist ({(() => { const p = progress(viewTask.checklist); return `${p.done}/${p.total}`; })()})
                    </Typography>
                  </Box>

                  {viewTask.checklist.length > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={progress(viewTask.checklist).pct}
                      sx={{ height: 8, borderRadius: 4, mb: 2 }}
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Add checklist item"
                      value={viewChecklistInput}
                      onChange={(e) => setViewChecklistInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklist(false); }}
                    />
                    <Button variant="contained" size="small" onClick={() => handleAddChecklist(false)}>
                      Add
                    </Button>
                  </Box>

                  {viewTask.checklist.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Checkbox
                        checked={item.isComplete}
                        onChange={() => handleToggleChecklist(item)}
                        size="small"
                      />
                      <Typography
                        sx={{
                          flexGrow: 1,
                          textDecoration: item.isComplete ? 'line-through' : 'none',
                          color: item.isComplete ? 'text.secondary' : 'inherit',
                        }}
                      >
                        {item.title}
                      </Typography>
                      <IconButton size="small" onClick={() => handleDeleteChecklist(item)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}

                  {viewTask.checklist.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No checklist items yet.
                    </Typography>
                  )}
                </>
              ) : (
                <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                  {loadingActivities ? (
                    <Typography variant="caption" color="text.secondary">Loading activity...</Typography>
                  ) : activities.length > 0 ? (
                    activities.map((act, idx) => (
                      <Box key={act.id} sx={{ display: 'flex', gap: 1.5, mb: 2, position: 'relative' }}>
                        {idx < activities.length - 1 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 15,
                              top: 38,
                              bottom: -10,
                              width: 2,
                              backgroundColor: '#e0e0e0',
                            }}
                          />
                        )}
                        <Avatar
                          src={act.user?.photo || undefined}
                          alt={`${act.user?.firstName || ''} ${act.user?.lastName || ''}`}
                          sx={{ width: 32, height: 32, zIndex: 1 }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">
                            <strong>
                              {act.user
                                ? `${act.user.firstName} ${act.user.lastName}`
                                : act.userId || 'System'}
                            </strong>{' '}
                            {describeActivity(act, users)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(act.createdAt).toLocaleString('en-GB')}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No activity yet.
                    </Typography>
                  )}
                </Box>
              )}
            </DialogContent>
            {canAct(viewTask) && STATUS_ACTIONS[viewTask.status] && STATUS_ACTIONS[viewTask.status].length > 0 && (
              <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                {STATUS_ACTIONS[viewTask.status].map((action) => (
                  <Button
                    key={action}
                    variant={action === 'complete' || action === 'approve' ? 'contained' : 'outlined'}
                    color={
                      ['complete', 'approve'].includes(action) ? 'primary'
                        : ['deny', 'disapprove'].includes(action) ? 'error'
                          : 'inherit'
                    }
                    onClick={() => handleStatusAction(viewTask, action)}
                  >
                    {ACTION_LABELS[action]}
                  </Button>
                ))}
              </DialogActions>
            )}
          </>
        )}
      </Dialog>
    </Box>
  );
};

const Autocomplete = ({ users, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      (u.employeeId || '').toLowerCase().includes(q)
    );
  });

  return (
    <FormControl fullWidth margin="normal">
      <InputLabel shrink>Assign To</InputLabel>
      <Select
        label="Assign To"
        value={value}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(val) => {
          const u = users.find((x) => x.employeeId === val);
          return u ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={u.photo || undefined} sx={{ width: 28, height: 28 }} />
              <span>{u.firstName} {u.lastName} ({u.employeeId})</span>
            </Box>
          ) : <span>{val || 'Select employee'}</span>;
        }}
      >
        <Box sx={{ p: 1 }}>
          <TextField
            autoFocus
            size="small"
            fullWidth
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>
        {options.length > 0 ? (
          options.map((u) => (
            <MenuItem key={u.employeeId} value={u.employeeId}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={u.photo || undefined} sx={{ width: 28, height: 28 }} />
                <span>{u.firstName} {u.lastName} ({u.employeeId})</span>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No employees found</MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

const MemberChip = ({ photo, name, subtitle, size = 28 }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
    <Avatar src={photo || undefined} sx={{ width: size, height: size }} />
    <Box>
      <Typography variant="body2" sx={{ lineHeight: 1.2 }}>{name}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

const MemberAdder = ({ users, selected, onAdd, onRemove }) => {
  const [draft, setDraft] = useState(null);

  const available = users.filter((u) => !selected.includes(u.employeeId));

  return (
    <Box>
      {selected.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
          {selected.map((employeeId, idx) => {
            const u = users.find((x) => x.employeeId === employeeId);
            return (
              <Box key={`${employeeId}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MemberChip
                  photo={u?.photo}
                  name={u ? `${u.firstName} ${u.lastName}` : employeeId}
                  subtitle={employeeId}
                />
                <IconButton size="small" onClick={() => onRemove(employeeId)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <MUIAutocomplete
          size="small"
          sx={{ flexGrow: 1 }}
          options={available}
          getOptionLabel={(u) => `${u.firstName} ${u.lastName} (${u.employeeId})`}
          value={draft}
          onChange={(e, val) => setDraft(val)}
          renderInput={(params) => <TextField {...params} placeholder="Search employee..." />}
        />
        <Button
          variant="contained"
          size="small"
          disabled={!draft}
          onClick={() => { onAdd(draft.employeeId); setDraft(null); }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default TasksProjects;