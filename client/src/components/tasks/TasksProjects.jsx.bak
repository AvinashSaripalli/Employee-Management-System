import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid, TextField, MenuItem, Select, FormControl,
  InputLabel, IconButton, LinearProgress, Checkbox, Tooltip, Tab, Tabs,
  Autocomplete as MUIAutocomplete, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  DeleteOutline as DeleteOutlineIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area, LabelList,
} from 'recharts';
import { FiClipboard, FiCheckCircle, FiClock, FiFileMinus, FiAward, FiUser, FiBarChart2, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
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
  1: ['accept', 'start'],
  2: ['start', 'complete'],
  3: ['pause', 'complete'],
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
  renew: 'Renew',
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
  const [statsView, setStatsView] = useState(false);

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

  const stats = useMemo(() => {
    const statusCounts = {};
    const priorityCounts = {};
    Object.keys(STATUS_META).forEach((k) => { statusCounts[k] = 0; });
    Object.keys(PRIORITY_META).forEach((k) => { priorityCounts[k] = 0; });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workloadMap = {};
    const overdueList = [];
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;

    tasks.forEach((task) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;

      if (task.status === 5) completed += 1;
      if (task.status === 3) inProgress += 1;

      const key = task.responsibleId || 'Unassigned';
      workloadMap[key] = workloadMap[key] || { count: 0, completed: 0 };
      workloadMap[key].count += 1;
      if (task.status === 5) workloadMap[key].completed += 1;

      const deadline = task.deadline ? new Date(task.deadline) : null;
      if (deadline && task.status !== 5 && task.status !== 7 && deadline < today) {
        overdue += 1;
        const daysOver = Math.max(1, Math.round((today - deadline) / (1000 * 60 * 60 * 24)));
        overdueList.push({ ...task, daysOver });
      }
    });

    const workload = Object.entries(workloadMap)
      .map(([employeeId, w]) => {
        const u = users.find((x) => x.employeeId === employeeId);
        return {
          employeeId,
          name: u ? `${u.firstName} ${u.lastName}` : employeeId === 'Unassigned' ? 'Unassigned' : employeeId,
          photo: u?.photo || '',
          count: w.count,
          completed: w.completed,
          pending: w.count - w.completed,
          pct: w.count ? Math.round((w.completed / w.count) * 100) : 0,
        };
      })
      .sort((a, b) => b.count - a.count);

    const monthly = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({ name: d.toLocaleString('en', { month: 'short' }), created: 0 });
    }
    tasks.forEach((task) => {
      const created = new Date(task.createdAt);
      const monthIdx = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      if (monthIdx >= 0 && monthIdx < 12) {
        monthly[11 - monthIdx].created += 1;
      }
    });

    return {
      total: tasks.length,
      completed,
      inProgress,
      overdue,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      myTasks: tasks.filter((t) => t.responsibleId === currentEmployeeId).length,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status: Number(status), count })),
      byPriority: Object.entries(priorityCounts).map(([priority, count]) => ({ priority: Number(priority), count })),
      monthly,
      workload,
      overdueList: overdueList.sort((a, b) => b.daysOver - a.daysOver),
    };
  }, [tasks, users, currentEmployeeId]);

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
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setFormData(initialState);
    setIsEditMode(false);
    setSelectedTaskId(null);
    setNewChecklistItem('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      responsibleId: currentEmployeeId || prev.responsibleId,
    }));
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
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Grid container spacing={3} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
            Tasks &amp; Projects
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>
            Plan, assign and track work across your team
          </Typography>
        </Grid>
        <Grid item>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={statsView ? 'stats' : 'list'}
              onChange={(e, value) => value && setStatsView(value === 'stats')}
              sx={{
                bgcolor: '#EEF2FA',
                borderRadius: 2,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  color: '#5B6B99',
                  px: 1.5,
                  '&.Mui-selected': { bgcolor: '#fff', color: 'primary.main', boxShadow: '0 2px 6px rgba(20,40,109,0.18)' },
                },
              }}
            >
              <ToggleButton value="list"><GridViewIcon sx={{ fontSize: 18, mr: 0.75 }} />List</ToggleButton>
              <ToggleButton value="stats"><BarChartIcon sx={{ fontSize: 18, mr: 0.75 }} />Statistics</ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Add Task
            </Button>
          </Box>
        </Grid>
      </Grid>

      {!statsView && (
        <Box>
          <Paper sx={{ p: 2.5, mb: 3 }}>
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
          borderRadius: 3,
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
                        <Tooltip title="View task">
                          <IconButton
                            size="small"
                            aria-label="View task"
                            onClick={() => handleView(task)}
                            sx={{ color: '#2067B0', '&:hover': { bgcolor: '#EAF4FC' } }}
                          >
                            <FiEye size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit task">
                          <IconButton
                            size="small"
                            aria-label="Edit task"
                            onClick={() => handleEdit(task)}
                            sx={{ color: '#14286D', '&:hover': { bgcolor: '#EEF2FF' } }}
                          >
                            <FiEdit2 size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete task">
                          <IconButton
                            size="small"
                            aria-label="Delete task"
                            onClick={() => handleDelete(task)}
                            sx={{ color: '#D64545', '&:hover': { bgcolor: '#FDECEC' } }}
                          >
                            <FiTrash2 size={18} />
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
        </Box>
      )}

      {statsView && (
        <StatsBoard stats={stats} onView={handleView} />
      )}

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
                        : action === 'disapprove' ? 'error'
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

const STATUS_COLORS = {
  1: '#94A3B8',
  2: '#0284C7',
  3: '#F59E0B',
  4: '#8B5CF6',
  5: '#16A34A',
  6: '#64748B',
  7: '#E11D48',
};

const PRIORITY_COLORS = { 0: '#94A3B8', 1: '#0284C7', 2: '#E11D48' };

const StatTile = ({ icon, label, value, sub, color, tint }) => (
  <Paper
    sx={{
      p: 2,
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 1.8,
      border: '1px solid #E8EEF9',
      boxShadow: '0 6px 18px rgba(20,40,109,0.07)',
      height: '100%',
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: tint,
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {sub}
        </Typography>
      )}
    </Box>
  </Paper>
);

const ChartCard = ({ title, subtitle, children, extra }) => (
  <Paper
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid #E8EEF9',
      boxShadow: '0 6px 18px rgba(20,40,109,0.07)',
      height: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {extra}
    </Box>
    {children}
  </Paper>
);

const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #E8EEF9',
  boxShadow: '0 8px 24px rgba(20,40,109,0.12)',
  fontSize: 13,
};

const StatsBoard = ({ stats, onView }) => {
  const statusData = stats.byStatus
    .filter((d) => d.count > 0)
    .map((d) => ({ name: STATUS_META[d.status].label, value: d.count, color: STATUS_COLORS[d.status] }));
  const priorityData = stats.byPriority
    .filter((d) => d.count > 0)
    .map((d) => ({ name: PRIORITY_META[d.priority].label, value: d.count, color: PRIORITY_COLORS[d.priority] }));
  const workloadData = stats.workload.map((w) => ({ name: w.name, Done: w.completed, Pending: w.pending }));

  const tiles = [
    { icon: <FiClipboard size="26" />, label: 'Total Tasks', value: stats.total, sub: `${stats.myTasks} assigned to you`, color: '#14286D', tint: '#E2E7F5' },
    { icon: <FiCheckCircle size="26" />, label: 'Completed', value: stats.completed, sub: `${stats.completionRate}% completion rate`, color: '#16A34A', tint: '#E7F6EC' },
    { icon: <FiClock size="26" />, label: 'In Progress', value: stats.inProgress, sub: 'currently being worked on', color: '#D97706', tint: '#FEF3E2' },
    { icon: <FiFileMinus size="26" />, label: 'Overdue', value: stats.overdue, sub: 'past their deadline', color: '#E11D48', tint: '#FDECF0' },
    { icon: <FiAward size="26" />, label: 'Completion Rate', value: `${stats.completionRate}%`, sub: 'of all tasks done', color: '#0284C7', tint: '#E0F2FE' },
    { icon: <FiUser size="26" />, label: 'My Tasks', value: stats.myTasks, sub: 'assigned to you', color: '#7C3AED', tint: '#F1E9FC' },
  ];

  if (stats.total === 0) {
    return (
      <Paper sx={{ p: 6, borderRadius: 3, border: '1px dashed #C9D6EE', textAlign: 'center' }}>
        <FiBarChart2 size="48" color="#C9D6EE" />
        <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 'bold' }}>
          No statistics yet
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
          Add some tasks and they will start appearing here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Grid container spacing={2.5}>
        {tiles.map((t) => (
          <Grid item xs={12} sm={6} md={4} xl={2} key={t.label}>
            <StatTile {...t} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid item xs={12} md={5}>
          <ChartCard title="Status Breakdown" subtitle="All tasks grouped by current status" extra={
            <Chip size="small" label={`${stats.total} total`} sx={{ bgcolor: '#EEF2FA', color: 'primary.main', fontWeight: 'bold' }} />
          }>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No data</Typography>
            )}
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <ChartCard title="Priority Distribution" subtitle="How tasks break down by priority" extra={
            <Typography variant="caption" color="text.secondary">
              {priorityData.filter((d) => d.name === 'High').length > 0
                ? `${priorityData.find((d) => d.name === 'High')?.value || 0} high priority` : 'no high priority'}
            </Typography>
          }>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={priorityData} barSize={52} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2FA" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={13} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={13} />
                  <RechartsTooltip cursor={{ fill: '#F6F9FF' }} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="top" style={{ fill: '#64748B', fontSize: 12, fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No data</Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid item xs={12} md={7}>
          <ChartCard title="Workload by Member" subtitle="Assigned vs completed tasks per member">
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(220, workloadData.length * 58)}>
                <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 24, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2FA" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={128}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <RechartsTooltip cursor={{ fill: '#F6F9FF' }} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Done" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Pending" stackId="a" fill="#E2E8F0" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No data</Typography>
            )}
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <ChartCard title="Tasks Created" subtitle="Over the last 12 months" extra={
            <Chip size="small" label="per month" sx={{ bgcolor: '#EEF2FA', color: 'primary.main', fontSize: 11 }} />
          }>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.monthly} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14286D" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#14286D" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2FA" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <RechartsTooltip cursor={{ stroke: '#C9D6EE' }} contentStyle={CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="created" name="Created" stroke="#14286D" strokeWidth={2.5} fill="url(#createdGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 2.5, borderRadius: 3, border: '1px solid #E8EEF9', boxShadow: '0 6px 18px rgba(20,40,109,0.07)', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #EEF2FA', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiClock size={20} color="#E11D48" />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Overdue Tasks
          </Typography>
          <Chip size="small" label={`${stats.overdue}`} sx={{ bgcolor: '#FDECF0', color: '#E11D48', fontWeight: 'bold' }} />
        </Box>
        {stats.overdueList.length > 0 ? (
          <TableContainer sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assignee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Deadline</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Overdue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.overdueList.map((task) => {
                  const statusMeta = STATUS_META[task.status] || STATUS_META[2];
                  return (
                    <TableRow key={task.id} hover sx={{ cursor: 'pointer' }} onClick={() => onView(task)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{task.title}</Typography>
                        <Chip size="small" label={statusMeta.label} color={statusMeta.color} variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>{task.responsible ? `${task.responsible.firstName} ${task.responsible.lastName}` : task.responsibleId}</TableCell>
                      <TableCell>{new Date(task.deadline).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#E11D48', fontWeight: 'bold' }}>
                          {task.daysOver} day{task.daysOver > 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
            <FiCheckCircle size="32" color="#16A34A" />
            <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.9rem' }}>
              Nothing overdue. Great job!
            </Typography>
          </Box>
        )}
      </Paper>
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