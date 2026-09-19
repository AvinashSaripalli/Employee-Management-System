import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { LEAD_STATUSES, LEAD_SOURCES, OPP_STAGES, ACT_TYPES } from '../utils/crmConstants';

export function LeadDialog({ open, onClose, onSave, initial }){
  const [form,setForm]=useState({ firstName:'', lastName:'', email:'', phone:'', accountName:'', source:'Website', status:'New', score:50, value:0, assignedTo:'', notes:'' });
  useEffect(()=>{ if(open) setForm(initial? {...form, ...initial}: { firstName:'', lastName:'', email:'', phone:'', accountName:'', source:'Website', status:'New', score:50, value:0, assignedTo:'', notes:'' }); },[open, initial]);
  const change=(k,v)=> setForm(p=>({...p,[k]:v}));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?'Edit Lead':'Add Lead'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1.5}>
          <Grid item xs={6}><TextField fullWidth label="First Name*" value={form.firstName} onChange={e=>change('firstName',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Last Name*" value={form.lastName} onChange={e=>change('lastName',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Email" value={form.email} onChange={e=>change('email',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone} onChange={e=>change('phone',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Account" value={form.accountName} onChange={e=>change('accountName',e.target.value)} /></Grid>
          <Grid item xs={3}><FormControl fullWidth><InputLabel>Source</InputLabel><Select label="Source" value={form.source} onChange={e=>change('source',e.target.value)}>{LEAD_SOURCES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={3}><FormControl fullWidth><InputLabel>Status</InputLabel><Select label="Status" value={form.status} onChange={e=>change('status',e.target.value)}>{LEAD_STATUSES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={4}><TextField fullWidth type="number" label="Score" value={form.score} onChange={e=>change('score', Number(e.target.value))} /></Grid>
          <Grid item xs={4}><TextField fullWidth type="number" label="Value ($)" value={form.value} onChange={e=>change('value', Number(e.target.value))} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Assigned To (Emp ID)" value={form.assignedTo} onChange={e=>change('assignedTo',e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" value={form.notes} onChange={e=>change('notes',e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={()=>onSave(form)} sx={{ bgcolor:'#14286D' }}>{initial?'Update':'Create'}</Button></DialogActions>
    </Dialog>
  );
}
export function AccountDialog({ open, onClose, onSave, initial }){
  const [form,setForm]=useState({ name:'', industry:'General', size:'1-10', website:'', city:'', ownerId:'' });
  useEffect(()=>{ if(open) setForm(initial? {...form, ...initial}: { name:'', industry:'General', size:'1-10', website:'', city:'', ownerId:'' }); },[open, initial]);
  const change=(k,v)=> setForm(p=>({...p,[k]:v}));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?'Edit Account':'Add Account'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1.5}>
          <Grid item xs={12}><TextField fullWidth label="Account Name*" value={form.name} onChange={e=>change('name',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Industry" value={form.industry} onChange={e=>change('industry',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Size" value={form.size} onChange={e=>change('size',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Website" value={form.website} onChange={e=>change('website',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="City" value={form.city} onChange={e=>change('city',e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Owner (Emp ID)" value={form.ownerId} onChange={e=>change('ownerId',e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={()=>onSave(form)} sx={{ bgcolor:'#14286D' }}>{initial?'Update':'Create'}</Button></DialogActions>
    </Dialog>
  );
}
export function OpportunityDialog({ open, onClose, onSave, initial, accounts }){
  const [form,setForm]=useState({ title:'', accountId:'', amount:0, stage:'Lead', probability:20, closeDate:'', assignedTo:'' });
  useEffect(()=>{ if(open) setForm(initial? {...form, ...initial, accountId: initial.accountId||''}: { title:'', accountId:'', amount:0, stage:'Lead', probability:20, closeDate:'', assignedTo:'' }); },[open, initial]);
  const change=(k,v)=> setForm(p=>({...p,[k]:v}));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?'Edit Opportunity':'Add Opportunity'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1.5}>
          <Grid item xs={12}><TextField fullWidth label="Title*" value={form.title} onChange={e=>change('title',e.target.value)} /></Grid>
          <Grid item xs={6}><FormControl fullWidth><InputLabel>Account</InputLabel><Select label="Account" value={form.accountId} onChange={e=>change('accountId',e.target.value)}><MenuItem value="">None</MenuItem>{accounts.map(a=> <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Amount ($)" value={form.amount} onChange={e=>change('amount', Number(e.target.value))} /></Grid>
          <Grid item xs={6}><FormControl fullWidth><InputLabel>Stage</InputLabel><Select label="Stage" value={form.stage} onChange={e=>change('stage',e.target.value)}>{OPP_STAGES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={3}><TextField fullWidth type="number" label="Prob %" value={form.probability} onChange={e=>change('probability', Number(e.target.value))} /></Grid>
          <Grid item xs={3}><TextField fullWidth type="date" label="Close Date" InputLabelProps={{shrink:true}} value={form.closeDate||''} onChange={e=>change('closeDate',e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Assigned To (Emp ID)" value={form.assignedTo} onChange={e=>change('assignedTo',e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={()=>onSave(form)} sx={{ bgcolor:'#14286D' }}>{initial?'Update':'Create'}</Button></DialogActions>
    </Dialog>
  );
}
export function ActivityDialog({ open, onClose, onSave, initial }){
  const [form,setForm]=useState({ type:'Call', subject:'', description:'', relatedType:'', relatedId:'', dueDate:'' });
  useEffect(()=>{ if(open) setForm(initial? {...form, ...initial}: { type:'Call', subject:'', description:'', relatedType:'', relatedId:'', dueDate:'' }); },[open, initial]);
  const change=(k,v)=> setForm(p=>({...p,[k]:v}));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?'Edit Activity':'Add Activity'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1.5}>
          <Grid item xs={6}><FormControl fullWidth><InputLabel>Type</InputLabel><Select label="Type" value={form.type} onChange={e=>change('type',e.target.value)}>{['Call','Meeting','Email','Task','Note'].map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6}><TextField fullWidth type="date" label="Due Date" InputLabelProps={{shrink:true}} value={form.dueDate||''} onChange={e=>change('dueDate',e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Subject*" value={form.subject} onChange={e=>change('subject',e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={e=>change('description',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Related Type" placeholder="Lead/Account/Opportunity" value={form.relatedType} onChange={e=>change('relatedType',e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Related ID" value={form.relatedId} onChange={e=>change('relatedId',e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={()=>onSave(form)} sx={{ bgcolor:'#14286D' }}>{initial?'Update':'Create'}</Button></DialogActions>
    </Dialog>
  );
}
