import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, Typography, Chip, Avatar, IconButton, Button, TextField, LinearProgress, Checkbox, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { Close as CloseIcon } from '@mui/icons-material';
import Autocomplete from './Autocomplete';
import MemberChip from './MemberChip';
import { STATUS_META, PRIORITY_META, STATUS_ACTIONS, ACTION_LABELS } from '../utils/taskConstants';
import { getProgress } from '../utils/taskHelpers';

export default function TaskDetailsDialog({ open, task, activities, loadingActivities, users, canAct, onClose, onStatusAction, onAddChecklist, onToggleChecklist, onDeleteChecklist, onAddMember, onRemoveMember, viewChecklistInput, setViewChecklistInput, teamAddType, setTeamAddType, teamAddUser, setTeamAddUser, viewTab, setViewTab }) {
  const [comment, setComment] = useState('');
  if(!task) return null;
  const p = getProgress(task.checklist);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Box>
            <Typography variant="h6">{task.title}</Typography>
            <Typography variant="caption" color="text.secondary">ID:{task.id} • by {task.creator? `${task.creator.firstName} ${task.creator.lastName}`: task.createdBy}</Typography>
          </Box>
          <IconButton onClick={onClose}><CloseIcon/></IconButton>
        </Box>
      </DialogTitle>
      <Tabs value={viewTab} onChange={(_,v)=>setViewTab(v)} sx={{ borderBottom:1, borderColor:'divider', px:2 }}>
        <Tab label="Overview" />
        <Tab label={`Activity ${activities.length?`(${activities.length})`:''}`} />
      </Tabs>
      <DialogContent dividers sx={{ maxHeight:'60vh', overflowY:'auto' }}>
        {viewTab===0 ? (
          <>
            <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', mb:1.5 }}>
              <Chip size="small" label={STATUS_META[task.status]?.label} color={STATUS_META[task.status]?.color} />
              <Chip size="small" label={PRIORITY_META[task.priority]?.label} color={PRIORITY_META[task.priority]?.color} />
              {task.deadline && <Chip size="small" label={`Due ${new Date(task.deadline).toLocaleDateString()}`} />}
              {task.taskControl && <Chip size="small" label="Approval required" variant="outlined" color="secondary"/>}
              {task.tags?.map(t=> <Chip key={t} size="small" label={`#${t}`} sx={{ bgcolor:'#EEF2FF' }} />)}
            </Box>
            {task.description && <Typography sx={{ whiteSpace:'pre-wrap', mb:2 }}>{task.description}</Typography>}
            {task.attachments?.length>0 && <Box sx={{ mb:2 }}><Typography variant="subtitle2" fontWeight={700}>Attachments</Typography><Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap', mt:0.5 }}>{task.attachments.map((a,i)=> <Chip key={i} label={a.name} size="small" variant="outlined"/> )}</Box></Box>}

            <Typography variant="subtitle1" fontWeight={700} sx={{ mt:2 }}>Team</Typography>
            <Typography variant="caption" color="text.secondary">Responsible</Typography>
            {task.responsible? <Box sx={{ mt:0.5 }}><MemberChip photo={task.responsible.photo} name={`${task.responsible.firstName} ${task.responsible.lastName}`} subtitle={task.responsible.designation || task.responsible.department || ''}/></Box> : <Typography variant="caption">—</Typography>}
            <Typography variant="caption" color="text.secondary" sx={{ display:'block', mt:1 }}>Creator</Typography>
            {task.creator? <MemberChip photo={task.creator.photo} name={`${task.creator.firstName} ${task.creator.lastName}`} subtitle={task.creator.designation || task.creator.department || ''}/> : <Typography variant="caption">—</Typography>}

            {['A','U'].map(type=>{
              const members=(task.members||[]).filter(m=>m.type===type);
              return (
                <Box key={type} sx={{ mt:1 }}>
                  <Typography variant="caption" color="text.secondary">{type==='A'?'Accomplishers':'Observers'}</Typography>
                  <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap', mt:0.5 }}>
                    {members.length? members.map(m=> <Box key={m.id} sx={{ display:'flex', alignItems:'center', gap:0.5 }}><MemberChip photo={m.user?.photo} name={m.user? `${m.user.firstName} ${m.user.lastName}`: 'Unknown'} subtitle={m.user?.designation || m.user?.department || ''} />{canAct(task) && <IconButton size="small" onClick={()=>onRemoveMember(m)}><FiTrash2 size={12}/></IconButton>}</Box>) : <Typography variant="caption">None</Typography>}
                  </Box>
                </Box>
              );
            })}

            {canAct(task) && (
              <Box sx={{ display:'flex', gap:1, mt:2, alignItems:'center' }}>
                <FormControl size="small" sx={{ minWidth:130 }}><InputLabel>Role</InputLabel><Select label="Role" value={teamAddType} onChange={e=>setTeamAddType(e.target.value)}><MenuItem value="A">Accomplisher</MenuItem><MenuItem value="U">Observer</MenuItem></Select></FormControl>
                <Box sx={{ flex:1 }}>
                  <Autocomplete users={users.filter(u=> !(task.members||[]).some(m=> m.type===teamAddType && m.userId===u.employeeId) && u.employeeId!==task.responsibleId && u.employeeId!==task.createdBy)} value={teamAddUser} onChange={setTeamAddUser} label="Add member" />
                </Box>
                <Button size="small" variant="contained" disabled={!teamAddUser} onClick={onAddMember}>Add</Button>
              </Box>
            )}

            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mt:3, mb:1 }}>
              <Typography fontWeight={700}>Checklist {p.done}/{p.total}</Typography>
              <Typography variant="caption">{p.pct}%</Typography>
            </Box>
            {p.total>0 && <LinearProgress variant="determinate" value={p.pct} sx={{ height:6, borderRadius:2, mb:1 }}/>}
            <Box sx={{ display:'flex', gap:1, mb:1 }}>
              <TextField size="small" fullWidth placeholder="Add item" value={viewChecklistInput} onChange={e=>setViewChecklistInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') onAddChecklist(); }} />
              <Button variant="contained" size="small" onClick={onAddChecklist}>Add</Button>
            </Box>
            {task.checklist?.map(item=>(
              <Box key={item.id} sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
                <Checkbox checked={item.isComplete} onChange={()=>onToggleChecklist(item)} size="small"/>
                <Typography sx={{ flex:1, textDecoration: item.isComplete?'line-through':'none' }}>{item.title}</Typography>
                <IconButton size="small" onClick={()=>onDeleteChecklist(item)}><FiTrash2 size={12}/></IconButton>
              </Box>
            ))}
          </>
        ) : (
          <Box sx={{ maxHeight:360, overflowY:'auto' }}>
            {loadingActivities? <Typography variant="caption">Loading...</Typography> : activities.length? activities.map((act, idx)=>(
              <Box key={act.id} sx={{ display:'flex', gap:1.5, mb:1.5, position:'relative' }}>
                <Avatar src={act.user?.photo||undefined} sx={{ width:28, height:28, fontSize:11 }}>{act.user? `${act.user.firstName[0]}${act.user.lastName[0]}`:'S'}</Avatar>
                <Box><Typography variant="body2"><b>{act.user? `${act.user.firstName} ${act.user.lastName}`: act.userId}</b> {act.action}</Typography><Typography variant="caption" color="text.secondary">{new Date(act.createdAt).toLocaleString()}</Typography></Box>
              </Box>
            )) : <Typography variant="caption">No activity</Typography>}
          </Box>
        )}
      </DialogContent>
      {canAct(task) && STATUS_ACTIONS[task.status]?.length>0 && (
        <Box sx={{ p:1.5, display:'flex', gap:1, flexWrap:'wrap', borderTop:'1px solid #E8EEF9' }}>
          {STATUS_ACTIONS[task.status].map(action=> <Button key={action} size="small" variant={['complete','approve'].includes(action)?'contained':'outlined'} color={action==='disapprove'?'error':'primary'} onClick={()=>onStatusAction(task, action)}>{ACTION_LABELS[action]}</Button>)}
        </Box>
      )}
    </Dialog>
  );
}
