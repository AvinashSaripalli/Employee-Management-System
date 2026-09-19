import React, { useState, useMemo } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Avatar, Stack, Typography } from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiSearch, FiFilter } from 'react-icons/fi';
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_STATUS_COLOR } from '../utils/crmConstants';

export default function LeadsBoard({ leads, onCreate, onEdit, onDelete, onConvert }){
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('All');
  const [source,setSource]=useState('All');
  const filtered = useMemo(()=> leads.filter(l=>{
    if(status!=='All' && l.status!==status) return false;
    if(source!=='All' && l.source!==source) return false;
    if(search && !`${l.firstName} ${l.lastName} ${l.email} ${l.accountName} ${l.source}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[leads, search, status, source]);

  return (
    <Paper sx={{ borderRadius:3, overflow:'hidden', border:'1px solid #E8EEF9' }}>
      <Box sx={{ p:2, display:'flex', gap:1, flexWrap:'wrap', alignItems:'center', borderBottom:'1px solid #EEF2FA' }}>
        <TextField size="small" placeholder="Search leads..." value={search} onChange={e=>setSearch(e.target.value)} InputProps={{ startAdornment:<FiSearch style={{ marginRight:6 }}/> }} sx={{ minWidth:220, '& .MuiOutlinedInput-root':{ borderRadius:2 } }} />
        <FormControl size="small" sx={{ minWidth:130 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={e=>setStatus(e.target.value)}><MenuItem value="All">All</MenuItem>{LEAD_STATUSES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" sx={{ minWidth:130 }}><InputLabel>Source</InputLabel><Select label="Source" value={source} onChange={e=>setSource(e.target.value)}><MenuItem value="All">All</MenuItem>{LEAD_SOURCES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
        <Box sx={{ flex:1 }}/>
        <Button variant="contained" startIcon={<FiPlus size={14}/>} onClick={onCreate} sx={{ bgcolor:'#14286D', textTransform:'none', borderRadius:2 }}>Add Lead</Button>
      </Box>
      <TableContainer sx={{ maxHeight:460 }}>
        <Table size="small" stickyHeader>
          <TableHead><TableRow><TableCell>Lead</TableCell><TableCell>Account</TableCell><TableCell>Source</TableCell><TableCell>Status</TableCell><TableCell>Score</TableCell><TableCell>Value</TableCell><TableCell>Owner</TableCell><TableCell align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {filtered.map(l=>(
              <TableRow key={l.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width:30, height:30, fontSize:12, bgcolor:'#EEF2FF' }}>{`${l.firstName[0]}${l.lastName[0]}`}</Avatar>
                    <Box><Typography fontWeight={700} fontSize={13}>{l.firstName} {l.lastName}</Typography><Typography variant="caption" color="text.secondary">{l.email||'—'}</Typography></Box>
                  </Stack>
                </TableCell>
                <TableCell>{l.accountName||'—'}</TableCell>
                <TableCell><Chip size="small" label={l.source} sx={{ height:18, fontSize:11 }}/></TableCell>
                <TableCell><Chip size="small" label={l.status} sx={{ bgcolor: LEAD_STATUS_COLOR[l.status]||'#EEF2FF', height:20, fontWeight:600, fontSize:11 }}/></TableCell>
                <TableCell><Box sx={{ width:60, height:6, bgcolor:'#E2E8F0', borderRadius:1, overflow:'hidden' }}><Box sx={{ width:`${l.score}%`, height:'100%', bgcolor: l.score>70?'#16A34A': l.score>40?'#F59E0B':'#EF4444' }}/></Box><Typography variant="caption">{l.score}</Typography></TableCell>
                <TableCell>${Number(l.value).toLocaleString()}</TableCell>
                <TableCell>{l.assignedTo||'—'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Convert"><IconButton size="small" onClick={()=>onConvert(l)} sx={{ color:'#16A34A' }}><FiArrowRight size={14}/></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" onClick={()=>onEdit(l)}><FiEdit2 size={14}/></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={()=>onDelete(l)} color="error"><FiTrash2 size={14}/></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py:4 }}><Typography color="text.secondary">No leads</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
