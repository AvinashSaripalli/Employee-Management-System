import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, Box, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Checkbox, Typography, Chip, Avatar, IconButton } from '@mui/material';
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import Autocomplete from './Autocomplete';

const initialState = {
  title: '', description: '', responsibleId: '', priority: 1, deadline: '', parentId: '', taskControl: false,
  checklist: [], accomplishers: [], observers: [], attachments: [], estimatedHours: '', tags: []
};

export default function TaskFormDialog({ open, onClose, onSubmit, users, tasks, initialData, isEditMode, defaultAssigneeId }) {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState(initialState);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(()=>{
    if(open){
      if(initialData) setFormData(prev=> ({...initialState, ...initialData}));
      else setFormData({ ...initialState, responsibleId: defaultAssigneeId || '' });
      setTab(0);
    }
  },[open, initialData, defaultAssigneeId]);

  const handleChange = (field, value)=> setFormData(prev=> ({...prev, [field]: value}));

  const addChecklist = ()=>{
    const title=newChecklistItem.trim();
    if(!title) return;
    setFormData(prev=> ({...prev, checklist:[...prev.checklist, title]}));
    setNewChecklistItem('');
  };
  const addTag = ()=>{
    const t=tagInput.trim();
    if(!t || formData.tags.includes(t)) return;
    setFormData(prev=> ({...prev, tags:[...prev.tags, t]}));
    setTagInput('');
  };
  const handleFile = (e)=>{
    const files=Array.from(e.target.files||[]);
    setFormData(prev=> ({...prev, attachments:[...prev.attachments, ...files.map(f=>({name:f.name, size:f.size}))]}));
  };

  const submit = ()=>{
    if(!formData.title.trim()) return;
    if(!formData.responsibleId) return;
    const payload = {
      ...formData,
      deadline: formData.deadline||null,
      parentId: formData.parentId||null,
      members: [...formData.accomplishers.map(userId=>({userId, type:'A'})), ...formData.observers.map(userId=>({userId, type:'U'}))],
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEditMode?'Edit Task':'Add Task'}</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb:2 }}>
          <Tab label="Details" />
          <Tab label="Checklist" />
          <Tab label="Team" />
          <Tab label="More" />
        </Tabs>

        {tab===0 && (
          <Box>
            <TextField fullWidth margin="normal" label="Task Title *" value={formData.title} onChange={e=>handleChange('title', e.target.value)} />
            <TextField fullWidth margin="normal" label="Description" multiline rows={3} value={formData.description} onChange={e=>handleChange('description', e.target.value)} />
            <Autocomplete users={users} value={formData.responsibleId} onChange={id=>handleChange('responsibleId', id)} />
            <Grid container spacing={2}>
              <Grid item xs={6}><FormControl fullWidth margin="normal"><InputLabel>Priority</InputLabel><Select label="Priority" value={formData.priority} onChange={e=>handleChange('priority', Number(e.target.value))}><MenuItem value={0}>Low</MenuItem><MenuItem value={1}>Normal</MenuItem><MenuItem value={2}>High</MenuItem></Select></FormControl></Grid>
              <Grid item xs={6}><TextField fullWidth margin="normal" label="Deadline" type="date" InputLabelProps={{shrink:true}} value={formData.deadline} onChange={e=>handleChange('deadline', e.target.value)} /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><FormControl fullWidth margin="normal"><InputLabel>Parent Task</InputLabel><Select label="Parent Task" value={formData.parentId} onChange={e=>handleChange('parentId', e.target.value)}><MenuItem value="">None</MenuItem>{tasks.filter(t=> !initialData || String(t.id)!==String(initialData.id)).map(t=> <MenuItem key={t.id} value={String(t.id)}>{t.title}</MenuItem>)}</Select></FormControl></Grid>
              <Grid item xs={6}><TextField fullWidth margin="normal" label="Estimated hours" type="number" value={formData.estimatedHours} onChange={e=>handleChange('estimatedHours', e.target.value)} /></Grid>
            </Grid>
            <Box sx={{ mt:1 }}><label><Checkbox checked={formData.taskControl} onChange={e=>handleChange('taskControl', e.target.checked)} /> Require creator approval</label></Box>
          </Box>
        )}

        {tab===1 && (
          <Box>
            <Box sx={{ display:'flex', gap:1, mb:1 }}>
              <TextField fullWidth size="small" label="New checklist item" value={newChecklistItem} onChange={e=>setNewChecklistItem(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addChecklist(); }} />
              <Button variant="contained" size="small" onClick={addChecklist}>Add</Button>
            </Box>
            {formData.checklist.map((item, idx)=>(
              <Box key={`${item}-${idx}`} sx={{ display:'flex', alignItems:'center', gap:1, mb:0.8, p:0.8, border:'1px solid #E8EEF9', borderRadius:2 }}>
                <Typography sx={{ flex:1 }}>{item}</Typography>
                <IconButton size="small" onClick={()=> setFormData(prev=> ({...prev, checklist: prev.checklist.filter((_,i)=>i!==idx)}))}><FiTrash2 size={14}/></IconButton>
              </Box>
            ))}
          </Box>
        )}

        {tab===2 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb:0.5 }}>Accomplishers</Typography>
            <MemberAdder users={users} selected={formData.accomplishers} onAdd={id=> !formData.accomplishers.includes(id) && handleChange('accomplishers', [...formData.accomplishers, id])} onRemove={id=> handleChange('accomplishers', formData.accomplishers.filter(x=>x!==id))} />
            <Box sx={{ mt:2 }}><Typography variant="subtitle2">Observers</Typography>
              <MemberAdder users={users} selected={formData.observers} onAdd={id=> !formData.observers.includes(id) && handleChange('observers', [...formData.observers, id])} onRemove={id=> handleChange('observers', formData.observers.filter(x=>x!==id))} />
            </Box>
          </Box>
        )}

        {tab===3 && (
          <Box>
            <TextField size="small" label="Add tag" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addTag(); }}} sx={{ mr:1 }} />
            <Button size="small" variant="outlined" onClick={addTag} startIcon={<FiPlus size={14}/>}>Add Tag</Button>
            <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap', mt:1 }}>{formData.tags.map(t=> <Chip key={t} label={t} onDelete={()=> handleChange('tags', formData.tags.filter(x=>x!==t))} size="small" />)}</Box>
            <Box sx={{ mt:2 }}>
              <Button variant="outlined" component="label" startIcon={<FiUpload size={14}/>}>Attach files<input type="file" hidden multiple onChange={handleFile} /></Button>
              <Box sx={{ mt:1, display:'flex', gap:0.5, flexWrap:'wrap' }}>{formData.attachments.map((f,i)=> <Chip key={i} label={`${f.name} (${(f.size/1024).toFixed(0)}KB)`} size="small" onDelete={()=> handleChange('attachments', formData.attachments.filter((_,idx)=>idx!==i))} />)}</Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>{isEditMode?'Update':'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function MemberAdder({ users, selected, onAdd, onRemove }) {
  const [q, setQ] = React.useState('');
  const filtered = users.filter(u=> !selected.includes(u.employeeId) && (`${u.firstName} ${u.lastName} ${u.employeeId}`.toLowerCase().includes(q.toLowerCase()))).slice(0,6);
  return (
    <Box>
      <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap', mb:1 }}>{selected.map(id=>{
        const u=users.find(x=>x.employeeId===id);
        return <Chip key={id} avatar={<Avatar src={u?.photo} sx={{ width:24, height:24 }}>{u? `${u.firstName[0]}${u.lastName[0]}`:'?'}</Avatar>} label={u? `${u.firstName} ${u.lastName}`: id} onDelete={()=>onRemove(id)} size="small" />;
      })}</Box>
      <TextField size="small" fullWidth placeholder="Search to add..." value={q} onChange={e=>setQ(e.target.value)} />
      {q && <Box sx={{ mt:1, border:'1px solid #E8EEF9', borderRadius:2, maxHeight:150, overflowY:'auto' }}>{filtered.map(u=> <Box key={u.employeeId} onClick={()=>{ onAdd(u.employeeId); setQ(''); }} sx={{ display:'flex', alignItems:'center', gap:1, p:0.8, cursor:'pointer', '&:hover':{bgcolor:'#F8FAFD'}} }><Avatar src={u.photo} sx={{ width:28, height:28 }}>{`${u.firstName[0]}${u.lastName[0]}`}</Avatar><Box><Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography><Typography variant="caption" color="text.secondary">{u.designation||u.role} • {u.department||'No dept'}</Typography></Box></Box>)}</Box>}
    </Box>
  );
}
