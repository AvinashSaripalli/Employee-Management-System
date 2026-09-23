import React, { useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, IconButton, Tooltip, Checkbox, LinearProgress, Typography, Skeleton, Stack, Menu, MenuItem, Badge } from '@mui/material';
import { FiEye, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight, FiCalendar, FiClock, FiUser, FiFlag, FiMoreHorizontal, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { STATUS_META, PRIORITY_META } from '../utils/taskConstants';
import { getProgress, isOverdue, buildTree, formatDeadline } from '../utils/taskHelpers';

const priorityStyle = {
  2: { bg: '#FEE2E2', color: '#DC2626', icon: '●', label: 'High' },
  1: { bg: '#E0F2FE', color: '#0284C7', icon: '●', label: 'Normal' },
  0: { bg: '#F1F5F9', color: '#64748B', icon: '●', label: 'Low' },
};

export default function TaskTable({ tasks, loading, selectedIds, setSelectedIds, onView, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState({});
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [statusTask, setStatusTask] = useState(null);
  const [hoverRow, setHoverRow] = useState(null);

  const tree = buildTree(tasks);
  const flat = [];
  const flatten = (nodes, depth = 0) => {
    for (const n of nodes) {
      flat.push({ task: n, depth });
      if (expanded[n.id] && n.children?.length) flatten(n.children, depth + 1);
    }
  };
  flatten(tree);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (e) => {
    if (e.target.checked) setSelectedIds(flat.map(f => f.task.id));
    else setSelectedIds([]);
  };
  const allChecked = flat.length > 0 && selectedIds.length === flat.length;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < flat.length;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E8EEF9', overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 4px 24px rgba(20,40,109,0.06)' }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EEF2FA', bgcolor: 'linear-gradient(90deg,#F8FAFD 0%,#FFFFFF 100%)' }}>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#EEF2FF', color: '#14286D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCheckCircle size={18} /></Box>
          <Box>
            <Typography fontWeight={800} fontSize={14} color="#0F172A">Tasks</Typography>
            <Typography variant="caption" color="text.secondary">{flat.length} total • {selectedIds.length} selected</Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${tasks.length} tasks`} sx={{ bgcolor: '#14286D', color: '#fff', fontWeight: 700, height: 22 }} />
      </Box>

      <TableContainer sx={{ maxHeight: 560, overflowY: 'auto', '&::-webkit-scrollbar': { width: 6, height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 } }}>
        <Table stickyHeader size="small" sx={{ '& td, & th': { verticalAlign: 'middle' }, '& .MuiTableCell-head': { bgcolor: '#F8FAFD', backdropFilter: 'blur(6px)', borderBottom: '1px solid #E8EEF9' } }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 44, textAlign: 'center' }}><Checkbox size="small" checked={allChecked} indeterminate={indeterminate} onChange={toggleAll} sx={{ color: '#64748B', '&.Mui-checked': { color: '#14286D' } }} /></TableCell>
              <TableCell align="left" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#475569', py: 1.5 }}>Task</TableCell>
              <TableCell align="left" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#475569', py: 1.5 }}>Assignee</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#475569', py: 1.5 }}>Priority</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#475569', py: 1.5 }}>Deadline</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#475569', py: 1.5 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#475569', py: 1.5 }}>Progress</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#475569', width: 120, py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton variant="circular" width={18} height={18} /></TableCell>
                  <TableCell><Skeleton width={180} height={16} /><Skeleton width={120} height={12} sx={{ mt: 0.5 }} /></TableCell>
                  <TableCell align="center"><Skeleton variant="circular" width={28} height={28} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width={60} height={20} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width={80} height={14} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width={70} height={20} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width={80} height={8} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width={80} height={24} sx={{ mx: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : flat.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: 3, bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCheckCircle size={28} color="#94A3B8" /></Box>
                    <Typography fontWeight={700} color="#0F172A">No tasks found</Typography>
                    <Typography variant="caption" color="text.secondary">Try adjusting filters or create a new task</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : flat.map(({ task, depth }) => {
              const p = getProgress(task.checklist);
              const overdue = isOverdue(task);
              const hasChildren = task.children && task.children.length > 0;
              const isSelected = selectedIds.includes(task.id);
              const isHovered = hoverRow === task.id;
              const pri = priorityStyle[task.priority] || priorityStyle[1];
              const status = STATUS_META[task.status] || STATUS_META[2];
              return (
                <TableRow
                  key={task.id}
                  hover
                  selected={isSelected}
                  onMouseEnter={() => setHoverRow(task.id)}
                  onMouseLeave={() => setHoverRow(null)}
                  sx={{
                    bgcolor: isSelected ? '#EFF6FF' : overdue ? '#FFFBEB' : '#fff',
                    '&:hover': { bgcolor: isSelected ? '#DBEAFE' : '#F8FAFD' },
                    borderLeft: `3px solid ${isSelected ? '#14286D' : isHovered ? '#CBD5E1' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <TableCell padding="checkbox"><Checkbox size="small" checked={isSelected} onChange={() => toggleSelect(task.id)} sx={{ '&.Mui-checked': { color: '#14286D' } }} /></TableCell>

                  <TableCell sx={{ py: 1.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, pl: depth * 2.5 }}>
                      {hasChildren ? (
                        <IconButton size="small" onClick={() => setExpanded(prev => ({ ...prev, [task.id]: !prev[task.id] }))} sx={{ mt: 0.2, width: 20, height: 20, bgcolor: expanded[task.id] ? '#EEF2FF' : '#F1F5F9' }}>
                          {expanded[task.id] ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                        </IconButton>
                      ) : (
                        <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: overdue ? '#EF4444' : p.pct === 100 ? '#16A34A' : '#CBD5E1' }} />
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight={700} fontSize={13} sx={{ color: '#0F172A', lineHeight: 1.2 }} noWrap title={task.title}>
                            {task.title}
                          </Typography>
                          {hasChildren && <Chip label={`${task.children.length}`} size="small" sx={{ height: 16, minWidth: 16, fontSize: 10, fontWeight: 700, bgcolor: '#EEF2FF', color: '#14286D' }} />}
                          {task.tags?.slice(0, 2).map(t => <Chip key={t} label={`#${t}`} size="small" sx={{ height: 16, fontSize: 9, bgcolor: '#F1F5F9' }} />)}
                        </Box>
                        {task.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280, lineHeight: 1.3 }}>{task.description}</Typography>
                        )}
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.4 }}>
                          {task.parentId && <Chip icon={<FiMoreHorizontal size={10} />} label={`Subtask`} size="small" sx={{ height: 16, fontSize: 9, bgcolor: '#F8FAFD' }} />}
                          {task.estimatedHours && <Chip icon={<FiClock size={10} />} label={`${task.estimatedHours}h`} size="small" sx={{ height: 16, fontSize: 9, bgcolor: '#F8FAFD' }} />}
                        </Stack>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell align="left">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Badge overlap="circular" badgeContent={isSelected ? <FiCheckCircle size={10} color="#fff" /> : null} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} sx={{ '& .MuiBadge-badge': { bgcolor: '#16A34A', width: 14, height: 14, border: '2px solid #fff' } }}>
                        <Avatar src={task.responsible?.photo || undefined} sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: task.responsible ? '#E0E7FF' : '#F1F5F9', color: '#3730A3', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                          {task.responsible ? `${task.responsible.firstName[0]}${task.responsible.lastName[0]}` : '?'}
                        </Avatar>
                      </Badge>
                      <Box sx={{ textAlign: 'left', minWidth: 0, maxWidth: 120 }}>
                        <Typography variant="caption" fontWeight={700} fontSize={12} noWrap>{task.responsible ? `${task.responsible.firstName} ${task.responsible.lastName}` : 'Unassigned'}</Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={10} noWrap display="block">{task.responsible?.designation || '—'}</Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: pri.color, ml: 0.5 }} />}
                      label={pri.label}
                      size="small"
                      sx={{ bgcolor: pri.bg, color: pri.color, fontWeight: 700, fontSize: 11, height: 22, border: '1px solid', borderColor: pri.color + '20' }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.4, borderRadius: 2, bgcolor: overdue ? '#FEF2F2' : '#F8FAFD', border: `1px solid ${overdue ? '#FECACA' : '#EEF2FA'}` }}>
                      <FiCalendar size={11} color={overdue ? '#DC2626' : '#64748B'} />
                      <Typography variant="caption" fontWeight={overdue ? 700 : 500} fontSize={11} color={overdue ? '#DC2626' : '#334155'}>{formatDeadline(task.deadline)}</Typography>
                    </Box>
                    {overdue && <Chip label={`${Math.round((new Date() - new Date(task.deadline)) / 86400000)}d overdue`} size="small" color="error" sx={{ ml: 0.5, height: 16, fontSize: 9, fontWeight: 700 }} />}
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      onClick={(e) => { setStatusTask(task); setStatusAnchor(e.currentTarget); }}
                      icon={<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: status.dot, ml: 0.7 }} />}
                      label={status.label}
                      size="small"
                      sx={{
                        bgcolor: status.bg, color: status.dot, fontWeight: 700, fontSize: 11, height: 22, border: '1px solid', borderColor: status.dot + '30',
                        cursor: 'pointer', '&:hover': { bgcolor: status.bg, filter: 'brightness(0.97)' }
                      }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    {p.total ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Box sx={{ width: 72, height: 6, bgcolor: '#E2E8F0', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                          <Box sx={{ width: `${p.pct}%`, height: '100%', bgcolor: p.pct === 100 ? '#16A34A' : p.pct > 70 ? '#14286D' : '#F59E0B', borderRadius: 2, transition: 'width 0.3s' }} />
                        </Box>
                        <Typography variant="caption" fontWeight={700} fontSize={11} sx={{ minWidth: 32, color: p.pct === 100 ? '#16A34A' : '#334155' }}>{p.done}/{p.total}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled" fontSize={11}>—</Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'center', opacity: isHovered || isSelected ? 1 : 0.55, transition: 'opacity 0.15s' }}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => onView(task)} sx={{ width: 28, height: 28, bgcolor: '#EFF6FF', color: '#2563EB', '&:hover': { bgcolor: '#DBEAFE' } }}><FiEye size={14} /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(task)} sx={{ width: 28, height: 28, bgcolor: '#EEF2FF', color: '#4F46E5', '&:hover': { bgcolor: '#E0E7FF' } }}><FiEdit2 size={14} /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(task)} sx={{ width: 28, height: 28, bgcolor: '#FEF2F2', color: '#DC2626', '&:hover': { bgcolor: '#FEE2E2' } }}><FiTrash2 size={14} /></IconButton></Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={statusAnchor} open={Boolean(statusAnchor)} onClose={() => setStatusAnchor(null)} PaperProps={{ sx: { borderRadius: 2, minWidth: 180, p: 0.5 } }}>
        {Object.entries(STATUS_META).map(([id, meta]) => (
          <MenuItem key={id} dense onClick={() => { setStatusAnchor(null); /* could call onStatusChange if provided */ }} sx={{ fontSize: 13, gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: meta.dot }} />{meta.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}
