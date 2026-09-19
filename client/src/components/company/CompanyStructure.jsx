import React, { useEffect, useState, useMemo } from 'react';
import { OrganizationChart } from 'primereact/organizationchart';
import {
  Box, Typography, Chip, Drawer, List, ListItem, ListItemAvatar, ListItemText, Avatar,
  ListItemButton, Snackbar, Alert, Stack, IconButton, Tooltip, TextField, InputAdornment,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Divider, Paper
} from '@mui/material';
import { FiSearch, FiPlus, FiEdit2, FiUserPlus, FiAward, FiUsers, FiGitBranch, FiXCircle, FiRefreshCw, FiBriefcase, FiChevronRight, FiGrid, FiTrash2 } from 'react-icons/fi';
import { HiOutlineBuildingOffice2, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import axios from '../../api/axios';
import AssignEmployeeDialog from './AssignEmployeeDialog';
import AddEmployeeDialog from '../employees/AddEmployeeDialog';
import UnassignedEmployeesDialog from './UnassignedEmployeesDialog';

const BITRIX_LEVEL_STYLES = {
  // Level 1: Root / Company
  first: {
    bg: '#F5F9FC',
    border: '#C8D7E4',
    titleColor: '#14286D',
    titleBorder: '#B5D5E3',
    headerBg: '#EAF1F8',
    headLabel: '#14286D',
    empTitle: '#14286D',
    badgeBg: '#14286D',
    badgeColor: '#FFFFFF',
  },
  // Level 2: Main Departments
  second: {
    bg: '#F8EFE8',
    border: '#E8CEBD',
    titleColor: '#B3560F',
    titleBorder: '#EFC2A1',
    headerBg: '#F3E5DC',
    headLabel: '#A34E0C',
    empTitle: '#D4650B',
    badgeBg: '#FE8600',
    badgeColor: '#FFFFFF',
  },
  // Level 3: Sub-teams / Units
  third: {
    bg: '#F1F5DE',
    border: '#D5E1A6',
    titleColor: '#53750C',
    titleBorder: '#C4DA86',
    headerBg: '#E7EFC9',
    headLabel: '#53750C',
    empTitle: '#53750C',
    badgeBg: '#7EA510',
    badgeColor: '#FFFFFF',
  },
  // Unassigned pool
  unassigned: {
    bg: '#FFF7ED',
    border: '#FDBA74',
    titleColor: '#C2410C',
    titleBorder: '#FDBA74',
    headerBg: '#FFEDD5',
    headLabel: '#C2410C',
    empTitle: '#EA580C',
    badgeBg: '#EA580C',
    badgeColor: '#FFFFFF',
  },
};

const CompanyStructure = () => {
  const [data, setData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDeptInfo, setSelectedDeptInfo] = useState(null);

  // Assign employee modal
  const [assignUser, setAssignUser] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);

  // Add NEW employee modal (preset to a department)
  const [addOpen, setAddOpen] = useState(false);
  const [addDept, setAddDept] = useState('');

  // Unassigned-employee picker (add existing employee to a department)
  const [pickOpen, setPickOpen] = useState(false);
  const [pickDept, setPickDept] = useState('');
  const [pickAsHead, setPickAsHead] = useState(false);

  // Add / Edit Department modal
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', supervisorId: '', parentId: '' });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const companyName = localStorage.getItem('companyName') || 'KN Advisors';

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/users', {
        params: { companyName },
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeUsers = response.data.filter((user) => user.exists === 1);
      setAllUsers(activeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({ open: true, message: 'Failed to load employees', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/departments', {
        params: { companyName },
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Distinct department names in current company
  const existingDepartments = useMemo(() => {
    const set = new Set();
    allUsers.forEach((u) => {
      const dept = (u.department || '').trim();
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [allUsers]);

  // Depth-first flattened department tree for the "Parent Department" picker
  const deptHierarchy = useMemo(() => {
    const byParent = {};
    departments.forEach((d) => {
      const key = d.parentId || 'root';
      (byParent[key] = byParent[key] || []).push(d);
    });
    const out = [];
    const walked = new Set();
    const walk = (parentKey, depth) => {
      (byParent[parentKey] || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((d) => {
          walked.add(d.id);
          out.push({ ...d, treeDepth: depth });
          walk(d.id, depth + 1);
        });
    };
    walk('root', 0);
    departments
      .filter((d) => d.parentId && !walked.has(d.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((d) => out.push({ ...d, treeDepth: 0 }));
    return out;
  }, [departments]);

  // The department being edited + all of its descendants must not be selectable
  // as its own parent (would create a cycle).
  const deptSubtree = useMemo(() => {
    const set = new Set();
    if (editingDept?.id) {
      set.add(editingDept.id);
      const findChildren = (pid) => {
        departments.forEach((d) => {
          if (d.parentId === pid) {
            set.add(d.id);
            findChildren(d.id);
          }
        });
      };
      findChildren(editingDept.id);
    }
    return set;
  }, [departments, editingDept]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const q = searchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.designation && u.designation.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [allUsers, searchQuery]);

  // Build Bitrix24 hierarchy structure
  useEffect(() => {
    setData(buildBitrixOrgStructure(filteredUsers, companyName, departments));
  }, [filteredUsers, companyName, departments]);

  const buildBitrixOrgStructure = (users, compName, savedDepartments = []) => {
    const depts = {};

    savedDepartments.forEach((department) => {
      depts[department.name] = { ...depts[department.name], record: department, head: null, managers: [], members: [] };
    });

    users.forEach((user) => {
      const dept = (user.department || '').trim();
      if (!depts[dept]) {
        depts[dept] = { ...depts[dept], head: depts[dept]?.head || null, managers: depts[dept]?.managers || [], members: depts[dept]?.members || [] };
      }

      const isMgr = user.role && (user.role.toLowerCase() === 'manager' || user.role.toLowerCase() === 'admin');

      if (isMgr) {
        if (!depts[dept].head) {
          depts[dept].head = user;
        } else {
          depts[dept].managers.push(user);
        }
      } else {
        depts[dept].members.push(user);
      }
    });

    // Root Company card (Bitrix style: Level 1 - first)
    const rootSupervisors = (depts['Management']?.head ? [depts['Management'].head] : [])
      .concat(depts['Management']?.managers || [])
      .concat(users.filter(u => u.role === 'Admin' || (u.role === 'Manager' && !u.department)));

    const rootHead = rootSupervisors[0] || users.find(u => u.role === 'Admin') || null;
    const rootEmployees = (depts['Management']?.members || []).concat(
      rootSupervisors.slice(1)
    );

    // Department cards (Bitrix style: Level 2 - second)
    const makeDepartmentCard = (deptName, visited = new Set()) => {
        const d = depts[deptName];
        const departmentKey = d.record?.id || deptName;
        if (visited.has(departmentKey)) return null;
        const nextVisited = new Set(visited);
        nextVisited.add(departmentKey);
        const allDeptUsers = (d.head ? [d.head] : []).concat(d.managers).concat(d.members);
        const children = Object.keys(depts)
          .filter((childName) => d.record?.id && depts[childName].record?.parentId === d.record.id)
          .sort((a, b) => a.localeCompare(b))
          .map((childName) => makeDepartmentCard(childName, nextVisited))
          .filter(Boolean);
        return {
          type: 'bitrix_dept',
          level: d.record?.parentId ? 'third' : 'second',
          expanded: true,
          data: {
            id: d.record?.id,
            name: deptName,
            supervisorId: d.record?.supervisorId || null,
            head: d.head,
            additionalManagers: d.managers,
            members: d.members,
            allUsers: allDeptUsers,
            count: allDeptUsers.length,
            parentId: d.record?.parentId || null,
          },
          children,
        };
      };

    const departmentCards = Object.keys(depts)
      .filter((dept) => dept !== '' && dept !== 'Management')
      .filter((dept) => !depts[dept].record?.parentId)
      .sort((a, b) => a.localeCompare(b))
      .map((deptName) => makeDepartmentCard(deptName));

    // Add unassigned users card if any
    const unassignedGroup = depts[''] || { head: null, managers: [], members: [] };
    const unassignedList = (unassignedGroup.head ? [unassignedGroup.head] : [])
      .concat(unassignedGroup.managers)
      .concat(unassignedGroup.members)
      .filter((user) => !rootSupervisors.some((supervisor) => supervisor.id === user.id));

    if (unassignedList.length > 0) {
      departmentCards.unshift({
        type: 'bitrix_dept',
        level: 'unassigned',
        expanded: true,
        data: {
          name: 'Unassigned',
          head: null,
          additionalManagers: [],
          members: unassignedList,
          allUsers: unassignedList,
          count: unassignedList.length,
          isUnassigned: true,
        },
      });
    }

    const rootNode = {
      type: 'bitrix_dept',
      level: 'first',
      expanded: true,
      data: {
        name: compName,
        isRoot: true,
        head: rootHead,
        additionalManagers: rootSupervisors.slice(1),
        members: rootEmployees,
        allUsers: users,
        count: users.length,
      },
      children: departmentCards,
    };

    return [rootNode];
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');

  // Handle department action click
  const handleOpenDepartmentDrawer = (deptData) => {
    setSelectedDeptInfo(deptData);
    setDrawerOpen(true);
  };

  const handleAssignOpen = (user) => {
    setAssignUser(user);
    setAssignOpen(true);
  };

  const handleRemoveMember = async (user) => {
    if (!selectedDeptInfo?.id || !user?.id) return;
    if (!window.confirm(`Remove ${user.firstName} ${user.lastName} from ${selectedDeptInfo.name}?`)) return;

    try {
      await axios.delete(`/departments/${selectedDeptInfo.id}/members/${user.id}`);
      setSnackbar({ open: true, message: `${user.firstName} ${user.lastName} removed from ${selectedDeptInfo.name}.`, severity: 'success' });
      setDrawerOpen(false);
      await Promise.all([fetchUsers(), fetchDepartments()]);
    } catch (error) {
      console.error('Error removing department member:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to remove employee from department', severity: 'error' });
    }
  };

  // Open the "Add / Assign Employee" picker for a department. It lists
  // existing employees who are not yet in any department, so the admin can
  // add one (or more) to this department. The "Unassigned" pool instead
  // allows creating a brand-new employee with no department.
  const handleAddEmployee = (deptName) => {
    // Never turn the company root or the unassigned pool into a real department.
    if (!deptName || deptName === 'Unassigned' || deptName === companyName) {
      setAddDept('');
      setAddOpen(true);
      return;
    }
    setPickAsHead(false);
    setPickDept(deptName);
    setPickOpen(true);
  };

  // Open the picker to designate an existing employee as the department head.
  // This also promotes them to Manager so they occupy the supervisor slot.
  const handleAssignSupervisor = (deptData) => {
    if (!deptData?.name || deptData.isRoot || deptData.isUnassigned) return;
    setPickAsHead(true);
    setPickDept(deptData.name);
    setPickOpen(true);
  };

  const handleDeleteDept = async (deptData, e) => {
    e && e.stopPropagation();
    if (!deptData.id) return;
    if (!window.confirm(`Delete department "${deptData.name}"? Members will be moved to its parent department.`)) return;
    try {
      await axios.delete(`/departments/${deptData.id}`);
      setSnackbar({ open: true, message: `Department '${deptData.name}' deleted.`, severity: 'success' });
      fetchUsers();
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to delete department', severity: 'error' });
    }
  };

  const handleOpenEditDept = (deptData, e) => {
    e && e.stopPropagation();
    setEditingDept(deptData);
    setDeptForm({
      name: deptData.name,
      // Prefer the stored department supervisor; fall back to the role-derived head
      supervisorId: deptData.supervisorId != null ? String(deptData.supervisorId) : (deptData.head?.id != null ? String(deptData.head.id) : ''),
      parentId: deptData.parentId != null ? String(deptData.parentId) : '',
    });
    setDeptModalOpen(true);
  };

  const handleOpenCreateDept = () => {
    setEditingDept(null);
    setDeptForm({ name: '', supervisorId: '', parentId: '' });
    setDeptModalOpen(true);
  };

  const handleSaveDeptForm = async () => {
    if (!deptForm.name.trim()) {
      setSnackbar({ open: true, message: 'Department name is required', severity: 'warning' });
      return;
    }

    try {
      if (editingDept?.id) {
        await axios.put(`/departments/${editingDept.id}`, {
          name: deptForm.name.trim(),
          parentId: deptForm.parentId || null,
          supervisorId: deptForm.supervisorId || null,
        });
        setSnackbar({ open: true, message: 'Department updated successfully!', severity: 'success' });
      } else {
        await axios.post('/departments', {
          name: deptForm.name.trim(),
          parentId: deptForm.parentId || null,
          supervisorId: deptForm.supervisorId || null,
          companyName,
        });
        setSnackbar({ open: true, message: `Department '${deptForm.name.trim()}' created!`, severity: 'success' });
      }

      setDeptModalOpen(false);
      fetchUsers();
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to save department', severity: 'error' });
    }
  };

  // Render Bitrix24 Department Node (.structure-dept-block)
  const renderBitrixDeptNode = (node) => {
    const { data: deptData, level = 'second' } = node;
    const style = BITRIX_LEVEL_STYLES[level] || BITRIX_LEVEL_STYLES.second;
    const isUnassigned = deptData.isUnassigned;
    const head = deptData.head;
    const members = deptData.members || [];
    const previewMembers = members.slice(0, 4);
    const extraCount = members.length - previewMembers.length;

    return (
      <Box
        sx={{
          width: 220,
          minHeight: 146,
          bgcolor: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          textAlign: 'left',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
            '& .bitrix-actions': { opacity: 1 },
          },
        }}
      >
        {/* Bitrix Department Title Header */}
        <Box
          sx={{
            px: 1.4,
            py: 0.9,
            borderBottom: `1px solid ${style.titleBorder}`,
            bgcolor: style.headerBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <Box
            onClick={() => handleOpenDepartmentDrawer(deptData)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              cursor: 'pointer',
              minWidth: 0,
              flex: 1,
            }}
          >
            {deptData.isRoot ? (
              <FiBriefcase size="16" color={style.titleColor} />
            ) : (
              <FiGitBranch size="15" color={style.titleColor} />
            )}
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: style.titleColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={deptData.name}
            >
              {deptData.name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={deptData.count}
              size="small"
              sx={{
                height: 20,
                minWidth: 20,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: style.badgeBg,
                color: style.badgeColor,
                '& .MuiChip-label': { px: 0.8 },
              }}
            />

            {!deptData.isRoot && !isUnassigned && (
              <Box
                className="bitrix-actions"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <Tooltip title="Edit Department">
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenEditDept(deptData, e)}
                    sx={{ p: 0.25, color: style.titleColor }}
                  >
                    <FiEdit2 size="13" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Department">
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteDept(deptData, e)}
                    sx={{ p: 0.25, color: '#DC2626' }}
                  >
                    <FiTrash2 size="13" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>

        {/* Bitrix Department Boss / Head (.structure-boss-block) */}
        <Box
          sx={{
            p: 1.2,
            minHeight: 46,
            borderBottom: '1px dashed rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            position: 'relative',
          }}
        >
          {head ? (
            <>
              <Tooltip title={`${head.firstName} ${head.lastName} (${head.role || 'Manager'})`}>
                <Avatar
                  src={head.photo}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: style.badgeBg,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  {getInitials(`${head.firstName} ${head.lastName}`)}
                </Avatar>
              </Tooltip>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1B2A5B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {head.firstName} {head.lastName}
                  </Typography>
                  <FiAward size="12" color="#FE8600" />
                </Box>
                <Typography
                  sx={{
                    fontSize: 10,
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.1,
                  }}
                >
                  {head.designation || (head.role === 'Admin' ? 'Administrator' : 'Department Head')}
                </Typography>
              </Box>
            </>
          ) : (
            <Box
              onClick={() => handleAssignSupervisor(deptData)}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.8,
                py: 0.6,
                border: '1px dashed #CBD5E1',
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: style.badgeBg,
                  bgcolor: 'rgba(255,255,255,0.8)',
                },
              }}
            >
              <FiUserPlus size="14" color={style.headLabel} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: style.headLabel }}>
                {isUnassigned ? 'Unassigned Pool' : '+ Assign Supervisor'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Bitrix Employees Block (.structure-employee-block) */}
        <Box sx={{ p: 1.2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: style.empTitle, letterSpacing: '0.04em' }}>
              EMPLOYEES ({members.length})
            </Typography>

            <Typography
              component="span"
              onClick={() => handleOpenDepartmentDrawer(deptData)}
              sx={{
                fontSize: 10.5,
                fontWeight: 600,
                color: '#2067B0',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View all
            </Typography>
          </Box>

          {/* Avatars Rack */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 28, mb: 0.5 }}>
            {previewMembers.length > 0 ? (
              <>
                {previewMembers.map((m) => (
                  <Tooltip key={m.id} title={`${m.firstName} ${m.lastName} • ${m.designation || 'Employee'}`}>
                    <Avatar
                      src={m.photo}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: 10,
                        fontWeight: 700,
                        bgcolor: '#14286D',
                        color: '#fff',
                        border: '1px solid #FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleAssignOpen(m)}
                    >
                      {getInitials(`${m.firstName} ${m.lastName}`)}
                    </Avatar>
                  </Tooltip>
                ))}

                {extraCount > 0 && (
                  <Box
                    onClick={() => handleOpenDepartmentDrawer(deptData)}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: '#E2E8F0',
                      color: '#475569',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    +{extraCount}
                  </Box>
                )}
              </>
            ) : (
              <Typography sx={{ fontSize: 10.5, color: '#94A3B8', fontStyle: 'italic' }}>
                No additional employees
              </Typography>
            )}
          </Box>

          {/* Action footer */}
          <Button
            size="small"
            startIcon={<FiUserPlus size="12" />}
            onClick={() => handleAddEmployee(deptData.name)}
            sx={{
              py: 0.2,
              px: 1,
              fontSize: 10.5,
              textTransform: 'none',
              fontWeight: 600,
              color: style.titleColor,
              borderRadius: 1.5,
              alignSelf: 'flex-start',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            + Add employee
          </Button>
        </Box>
      </Box>
    );
  };

  const nodeTemplate = (node) => {
    return renderBitrixDeptNode(node);
  };

  const drawerMembers = selectedDeptInfo ? selectedDeptInfo.allUsers : [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFD', minHeight: 'calc(100vh - 68px)' }}>
      {/* Top Bitrix Control Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid #E8ECF5',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                bgcolor: '#EEF2FF',
                color: '#14286D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiGitBranch size="22" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#14286D', lineHeight: 1.2 }}>
                Company Structure
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {companyName} • Visual organization tree, department divisions & staff assignments
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search employee or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch size="16" color="#8A94B0" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <FiXCircle size="14" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ width: { xs: '100%', sm: 260 } }}
          />

          <Tooltip title="Reload structure">
            <IconButton
              onClick={() => {
                fetchUsers();
                fetchDepartments();
              }}
              sx={{ border: '1px solid #E8ECF5', bgcolor: '#FFFFFF', borderRadius: 2 }}
            >
              <FiRefreshCw size="18" color="#14286D" />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<FiPlus size="18" />}
            onClick={handleOpenCreateDept}
            sx={{
              bgcolor: '#14286D',
              '&:hover': { bgcolor: '#0B1844' },
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.2,
            }}
          >
            Add Department
          </Button>
        </Stack>
      </Paper>

      {/* Bitrix Structure Legend */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', px: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
          Structure Legend:
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#C8D7E4', border: '1px solid #B5D5E3' }} />
          <Typography variant="caption" sx={{ color: '#14286D', fontWeight: 600 }}>Head Office (Level 1)</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#E8CEBD', border: '1px solid #EFC2A1' }} />
          <Typography variant="caption" sx={{ color: '#B3560F', fontWeight: 600 }}>Department Division (Level 2)</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#D5E1A6', border: '1px solid #C4DA86' }} />
          <Typography variant="caption" sx={{ color: '#53750C', fontWeight: 600 }}>Teams & Units (Level 3)</Typography>
        </Stack>
        <Chip
          label={`${allUsers.length} total employees`}
          size="small"
          sx={{ ml: 'auto', bgcolor: '#E8EEF9', color: '#14286D', fontWeight: 700 }}
        />
      </Box>

      {/* Main Interactive Bitrix Organization Chart */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid #E8ECF5',
          bgcolor: '#FFFFFF',
          minHeight: 520,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflowX: 'auto',
          '& .p-organizationchart': {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          },
          '& .p-organizationchart-table': {
            borderSpacing: '0 12px',
            margin: '0 auto',
          },
          '& .p-organizationchart-line-down': {
            backgroundColor: '#9FB3D8',
            height: '24px',
            width: '2px',
          },
          '& .p-organizationchart-line-left': {
            borderRight: '2px solid #9FB3D8',
          },
          '& .p-organizationchart-line-right': {
            borderLeft: '2px solid #9FB3D8',
          },
          '& .p-organizationchart-line-top': {
            borderTop: '2px solid #9FB3D8',
          },
          '& .p-organizationchart-node-content': {
            padding: '0 12px',
            border: 'none',
            background: 'transparent',
          },
        }}
      >
        {data.length > 0 ? (
          <OrganizationChart value={data} nodeTemplate={nodeTemplate} />
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">Loading organization structure...</Typography>
          </Box>
        )}
      </Paper>

      {/* Department Staff Roster Slide-out Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 3, mt: '68px' } }}
      >
        {selectedDeptInfo && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderBottom: '1px solid #E8ECF5' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#14286D' }}>
                  {selectedDeptInfo.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {drawerMembers.length} active employee(s) in department
                </Typography>
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <FiXCircle size="20" />
              </IconButton>
            </Box>

            {/* Department Head Card in Drawer */}
            {selectedDeptInfo.head && (
              <Box sx={{ my: 2, p: 2, bgcolor: '#F5F9FC', borderRadius: 2.5, border: '1px solid #C8D7E4' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#14286D', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FiAward size="14" color="#FE8600" /> Department Head / Supervisor
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                  <Avatar
                    src={selectedDeptInfo.head.photo}
                    sx={{ width: 44, height: 44, bgcolor: '#14286D', color: '#fff', fontWeight: 700 }}
                  >
                    {getInitials(`${selectedDeptInfo.head.firstName} ${selectedDeptInfo.head.lastName}`)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                      {selectedDeptInfo.head.firstName} {selectedDeptInfo.head.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                      {selectedDeptInfo.head.designation || 'Manager'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#14286D' }} noWrap>
                      {selectedDeptInfo.head.email}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Employee List */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, mb: 1.5, color: '#475569' }}>
              Department Members ({drawerMembers.length})
            </Typography>

            <List sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {drawerMembers.map((user) => {
                const isHead = user.id === selectedDeptInfo.head?.id;
                return (
                  <ListItem
                    key={user.id}
                    sx={{
                      mb: 1.2,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      border: '1px solid #E8ECF5',
                      p: 1.2,
                      alignItems: 'center',
                      '&:hover': { bgcolor: '#F8FAFD' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={user.photo}
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: '#14286D',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(`${user.firstName} ${user.lastName}`)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ minWidth: 0, flex: 1, mr: 1 }}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          {isHead && <FiAward size="12" color="#FE8600" />}
                        </Box>
                      }
                      secondary={
                        <Box component="span">
                          <Typography component="span" sx={{ fontSize: 11.5, color: 'text.secondary', display: 'block' }}>
                            {user.designation || user.role || 'Employee'}
                          </Typography>
                          <Typography component="span" sx={{ fontSize: 10.5, color: '#64748B', display: 'block' }}>
                            {user.email}
                          </Typography>
                        </Box>
                      }
                    />
                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
                      <Button
                        size="small"
                        onClick={() => handleAssignOpen(user)}
                        sx={{
                          minWidth: 0,
                          px: 1,
                          fontSize: 11,
                          textTransform: 'none',
                          fontWeight: 700,
                          bgcolor: '#EEF2FF',
                          color: '#14286D',
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#14286D', color: '#FFFFFF' },
                        }}
                      >
                        Transfer
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleRemoveMember(user)}
                        sx={{
                          minWidth: 0,
                          px: 1,
                          fontSize: 11,
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#B42318',
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#FDECEC' },
                        }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </ListItem>
                );
              })}

              {drawerMembers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No employees currently assigned to this department.
                  </Typography>
                </Box>
              )}
            </List>

            <Box sx={{ pt: 2, borderTop: '1px solid #E8ECF5' }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FiUserPlus size="16" />}
                onClick={() => handleAddEmployee(selectedDeptInfo.name)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  color: '#14286D',
                  borderColor: '#14286D',
                }}
              >
                + Add / Assign Employee to Department
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Add / Edit Department Dialog */}
      <Dialog
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, borderBottom: '1px solid #E8ECF5' }}>
          {editingDept ? 'Edit Department' : 'Create Department'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <TextField
            label="Department Name"
            fullWidth
            size="small"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            placeholder="e.g. Wealth Advisory, Client Strategy"
            sx={{ mb: 2.5 }}
          />

          <TextField
            select
            label="Parent Department"
            fullWidth
            size="small"
            value={deptForm.parentId}
            onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
            helperText="Leave empty for a top-level department"
            sx={{ mb: 2.5 }}
          >
            <MenuItem value=""><em>None (Top-level department)</em></MenuItem>
            {deptHierarchy
              .filter((department) => !deptSubtree.has(department.id) && department.name !== 'Management')
              .map((department) => (
                <MenuItem key={department.id} value={String(department.id)} sx={{ pl: 1.5 + department.treeDepth * 2 }}>
                  {department.treeDepth > 0 && (
                    <Typography component="span" sx={{ color: '#94A3B8', mr: 0.6 }}>└─</Typography>
                  )}
                  {department.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Assign Department Supervisor"
            fullWidth
            size="small"
            value={deptForm.supervisorId}
            onChange={(e) => setDeptForm({ ...deptForm, supervisorId: e.target.value })}
            helperText="Designates this employee as the supervisor/head of department"
          >
            <MenuItem value="">
              <em>None (Vacant)</em>
            </MenuItem>
            {allUsers.map((u) => (
              <MenuItem key={u.id} value={String(u.id)}>
                {u.firstName} {u.lastName} ({u.department || 'Unassigned'} • {u.designation || u.role})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #E8ECF5' }}>
          <Button onClick={() => setDeptModalOpen(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDeptForm}
            variant="contained"
            sx={{
              bgcolor: '#14286D',
              '&:hover': { bgcolor: '#0B1844' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
            }}
          >
            {editingDept ? 'Save Changes' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign / Move Employee Dialog */}
      <AssignEmployeeDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        user={assignUser}
        existingDepartments={existingDepartments}
        onAssigned={() => {
          setAssignOpen(false);
          fetchUsers();
          fetchDepartments();
        }}
      />

      {/* Add New Employee Dialog (pre-set department) */}
      <AddEmployeeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={() => {
          fetchUsers();
          fetchDepartments();
        }}
        initialDepartment={addDept}
      />

      {/* Unassigned Employees Picker — add existing employee to a department */}
      <UnassignedEmployeesDialog
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        department={pickDept}
        employees={allUsers}
        onAssigned={() => {
          fetchUsers();
          fetchDepartments();
        }}
        onCreateNew={() => {
          setPickOpen(false);
          setAddDept(pickDept);
          setAddOpen(true);
        }}
      />

      {/* Toast Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyStructure;

