import React, { useState } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Typography, Stack, Checkbox } from '@mui/material';
import { FiPlus, FiCheck, FiTrash2, FiEdit2, FiPhone, FiMail, FiCalendar, FiFileText } from 'react-icons/fi';
import { ACT_TYPES } from '../utils/crmConstants';

const iconFor = (t)=> t==='Call'? <FiPhone size={12}/>: t==='Meeting'? <FiCalendar size={12}/>: t==='Email'? <FiMail size={12}/>: <FiFileText size={12}/>;

export default function ActivitiesBoard({ activities, onCreate, onToggle, onDelete, onEdit }){
  const [filter,setFilter]=useState('All');
  const filtered = activities.filter(a=> filter==='All' || a.type===filter);
  return (
    <Paper sx={{ borderRadius:3, border:'1px solid #E8EEF9', overflow:'hidden' }}>
      <Box sx={{ p:2, display:'flex', gap:1, alignItems:'center', flexWrap:'wrap', borderBottom:'1px solid #EEF2FA' }}>
        <Typography fontWeight={800}>Activities</Typography>
        <FormControl size="small" sx={{ minWidth:120, ml:1 }}><InputLabel>Type</InputLabel><Select label="Type" value={filter} onChange={e=>setFilter(e.target.value)}><MenuItem value="All">All</MenuItem>{ACT_TYPES.map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl>
        <Box sx={{ flex:1 }}/>
        <Button size="small" variant="contained" startIcon={<FiPlus size={14}/>} onClick={onCreate} sx={{ bgcolor:'#14286D', textTransform:'none', borderRadius:2 }}>Add Activity</Button>
      </Box>
      <TableContainer sx={{ maxHeight:420 }}>
        <Table size="small" stickyHeader>
          <TableHead><TableRow><TableCell>Done</TableCell><TableCell>Type</TableCell><TableCell>Subject</TableCell><TableCell>Related</TableCell><TableCell>Due</TableCell><TableCell>Owner</TableCell><TableCell align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {filtered.map(a=>{
              const overdue = a.dueDate && !a.done && new Date(a.dueDate) < new Date();
              return (
                <TableRow key={a.id} hover sx={{ bgcolor: overdue? '#FFF7ED': undefined }}>
                  <TableCell><Checkbox size="small" checked={!!a.done} onChange={()=>onToggle(a)} /></TableCell>
                  <TableCell><Chip icon={iconFor(a.type)} label={a.type} size="small" sx={{ height:20, fontSize:11 }} /></TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={13}>{a.subject}</Typography><Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth:260, display:'block' }}>{a.description||''}</Typography></TableCell>
                  <TableCell>{a.relatedType? `${a.relatedType}#${a.relatedId}`:'—'}</TableCell>
                  <TableCell sx={{ color: overdue?'#DC2626':undefined }}>{a.dueDate? new Date(a.dueDate).toLocaleDateString(): '—'}</TableCell>
                  <TableCell>{a.createdBy||'—'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={()=>onEdit(a)}><FiEdit2 size={13}/></IconButton>
                    <IconButton size="small" color="error" onClick={()=>onDelete(a)}><FiTrash2 size={13}/></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length===0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py:3 }}><Typography color="text.secondary">No activities</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
