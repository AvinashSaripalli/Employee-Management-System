import React from 'react';
import { Box, Paper, Typography, Chip, Avatar, Card, CardContent, IconButton, Tooltip, Badge } from '@mui/material';
import { FiEye, FiEdit2, FiTrash2, FiClock, FiAlertCircle } from 'react-icons/fi';
import { STATUS_META, PRIORITY_META, STATUS_ORDER } from '../utils/taskConstants';
import { getProgress, isOverdue } from '../utils/taskHelpers';

export default function TaskKanban({ tasks, onView, onEdit, onDelete, onStatusChange }) {
  const cols = STATUS_ORDER.map(s=> ({ status:s, meta: STATUS_META[s], tasks: tasks.filter(t=> t.status===s ) }));

  const handleDrop = (e, newStatus)=>{
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t=> String(t.id)===id);
    if(task && task.status!==newStatus){
      onStatusChange(task, newStatus);
    }
  };

  return (
    <Box sx={{ display:'flex', gap:2, overflowX:'auto', pb:2, minHeight:520 }}>
      {cols.map(col=>(
        <Paper key={col.status} onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e, col.status)} elevation={0} sx={{ minWidth:300, maxWidth:320, flexShrink:0, bgcolor:'#F8FAFD', border:'1px solid #E8EEF9', borderRadius:3, display:'flex', flexDirection:'column' }}>
          <Box sx={{ p:1.5, borderBottom:'1px solid #E8EEF9', display:'flex', alignItems:'center', gap:1, bgcolor:'#fff', borderTopLeftRadius:12, borderTopRightRadius:12 }}>
            <Box sx={{ width:10, height:10, borderRadius:'50%', bgcolor: col.meta.dot }} />
            <Typography fontWeight={700} fontSize={13}>{col.meta.label}</Typography>
            <Chip label={col.tasks.length} size="small" sx={{ ml:'auto', height:20, fontSize:11, bgcolor:'#EEF2FF' }} />
          </Box>
          <Box sx={{ p:1, flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:1, minHeight:400 }}>
            {col.tasks.length===0 ? <Typography variant="caption" color="text.secondary" sx={{ textAlign:'center', py:4 }}>No tasks</Typography> :
              col.tasks.map(task=>{
                const p=getProgress(task.checklist);
                const overdue=isOverdue(task);
                return (
                  <Card key={task.id} draggable onDragStart={e=> e.dataTransfer.setData('text/plain', String(task.id))} elevation={1} sx={{ borderRadius:2, cursor:'grab', borderLeft: overdue?'4px solid #DC2626': `4px solid ${col.meta.dot}`, '&:active':{cursor:'grabbing'} }}>
                    <CardContent sx={{ p:1.5, '&:last-child':{pb:1.5} }}>
                      <Typography fontWeight={600} fontSize={13} sx={{ mb:0.5, display:'flex', alignItems:'center', gap:0.5 }}>{task.title} {overdue && <FiAlertCircle size={12} color="#DC2626"/>}</Typography>
                      {task.description && <Typography variant="caption" color="text.secondary" sx={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{task.description}</Typography>}
                      <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:1 }}>
                        <Avatar src={task.responsible?.photo||undefined} sx={{ width:24, height:24, fontSize:11 }}>{task.responsible? `${task.responsible.firstName[0]}${task.responsible.lastName[0]}`:'?'}</Avatar>
                        <Typography variant="caption" fontWeight={600}>{task.responsible? `${task.responsible.firstName}`: 'Unassigned'}</Typography>
                        <Chip size="small" label={PRIORITY_META[task.priority]?.label} color={PRIORITY_META[task.priority]?.color} sx={{ ml:'auto', height:18, fontSize:9 }} />
                      </Box>
                      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mt:1 }}>
                        <Typography variant="caption" color={overdue?'error': 'text.secondary'} sx={{ display:'flex', alignItems:'center', gap:0.3 }}><FiClock size={10}/> {task.deadline? new Date(task.deadline).toLocaleDateString(): 'No due'}</Typography>
                        {p.total>0 && <Typography variant="caption" sx={{ bgcolor: p.pct===100?'#DCFCE7':'#EEF2FF', px:0.8, py:0.2, borderRadius:1 }}>{p.done}/{p.total} • {p.pct}%</Typography>}
                      </Box>
                      <Box sx={{ display:'flex', gap:0.5, mt:1, justifyContent:'flex-end' }}>
                        <Tooltip title="View"><IconButton size="small" onClick={()=>onView(task)}><FiEye size={14}/></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={()=>onEdit(task)}><FiEdit2 size={14}/></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={()=>onDelete(task)}><FiTrash2 size={14}/></IconButton></Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                )
              })
            }
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
