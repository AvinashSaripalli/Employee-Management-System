import React, { useState } from 'react';
import { TextField, Paper, List, ListItem, ListItemButton, ListItemAvatar, Avatar, Typography, Box } from '@mui/material';

export default function Autocomplete({ users=[], value, onChange, label="Assignee *" }){
  const [q,setQ]=React.useState('');
  const [open,setOpen]=useState(false);
  const selected = users.find(u=>u.employeeId===value);
  const filtered = users.filter(u=> `${u.firstName} ${u.lastName} ${u.department} ${u.email}`.toLowerCase().includes(q.toLowerCase())).slice(0,8);
  return (
    <Box sx={{ position:'relative', mt:2 }}>
      <TextField fullWidth label={label} value={selected? `${selected.firstName} ${selected.lastName}` : q} onChange={e=>{ setQ(e.target.value); setOpen(true); if(!e.target.value) onChange(''); }} onFocus={()=>setOpen(true)} onBlur={()=> setTimeout(()=>setOpen(false),200)} placeholder="Search employee..." />
      {open && q && (
        <Paper sx={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, maxHeight:220, overflowY:'auto', mt:0.5, border:'1px solid #E8EEF9' }}>
          <List dense>
            {filtered.map(u=>(
              <ListItem key={u.employeeId} disablePadding>
                <ListItemButton onClick={()=>{ onChange(u.employeeId); setQ(''); setOpen(false); }}>
                  <ListItemAvatar><Avatar src={u.photo} sx={{ width:30, height:30 }}>{`${u.firstName[0]}${u.lastName[0]}`}</Avatar></ListItemAvatar>
                  <Box><Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography><Typography variant="caption" color="text.secondary">{u.department||'No dept'} • {u.email||''}</Typography></Box>
                </ListItemButton>
              </ListItem>
            ))}
            {filtered.length===0 && <Typography variant="caption" sx={{ p:1, display:'block', textAlign:'center' }}>No matches</Typography>}
          </List>
        </Paper>
      )}
    </Box>
  );
}
