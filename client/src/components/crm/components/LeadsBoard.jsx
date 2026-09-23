import React, { useState, useMemo } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Avatar, Stack, Typography, ToggleButton, ToggleButtonGroup, Checkbox, Alert } from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiSearch, FiAlertTriangle, FiZap, FiTag, FiGrid, FiList } from 'react-icons/fi';
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_STATUS_COLOR } from '../utils/crmConstants';

const healthColor = (h)=> h==='Hot'? '#EF4444': h==='Warm'? '#F59E0B':'#64748B';
const healthBg = (h)=> h==='Hot'? '#FEE2E2': h==='Warm'? '#FEF3C2':'#F1F5F9';

export default function LeadsBoard({ leads, onCreate, onEdit, onDelete, onConvert }){
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('All');
  const [source,setSource]=useState('All');
  const [view,setView]=useState('table');
  const [selected,setSelected]=useState([]);

  const filtered = useMemo(()=> leads.filter(l=>{
    if(status!=='All' && l.status!==status) return false;
    if(source!=='All' && l.source!==source) return false;
    if(search && !`${l.firstName} ${l.lastName} ${l.email} ${l.accountName} ${l.source} ${l.tags?.join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[leads, search, status, source]);

  const toggleSelect = (id)=> setSelected(prev=> prev.includes(id)? prev.filter(x=>x!==id): [...prev,id]);
  const duplicateCount = leads.filter(l=> l.isDuplicate).length;

  return (
    <Box>
      <Paper sx={{ p:1.5, mb:1.5, borderRadius:3, border:'1px solid #E8EEF9', display:'flex', gap:1, flexWrap:'wrap', alignItems:'center' }}>
        <TextField size="small" placeholder="Search leads, account, tags..." value={search} onChange={e=>setSearch(e.target.value)} InputProps={{ startAdornment:<FiSearch style={{ marginRight:6 }}/> }} sx={{ minWidth:240, flex:1, maxWidth:380, '& .MuiOutlinedInput-root':{ borderRadius:2, bgcolor:'#F8FAFD' } }} />
        <FormControl size="small" sx={{ minWidth:130 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={e=>setStatus(e.target.value)}><MenuItem value="All">All</MenuItem>{LEAD_STATUSES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" sx={{ minWidth:130 }}><InputLabel>Source</InputLabel><Select label="Source" value={source} onChange={e=>setSource(e.target.value)}><MenuItem value="All">All</MenuItem>{LEAD_SOURCES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_,v)=> v && setView(v)} sx={{ bgcolor:'#F1F5F9', borderRadius:2, '& .Mui-selected':{ bgcolor:'#fff' } }}>
          <ToggleButton value="table"><FiList size={14} style={{ marginRight:6 }}/>Table</ToggleButton>
          <ToggleButton value="kanban"><FiGrid size={14} style={{ marginRight:6 }}/>Board</ToggleButton>
        </ToggleButtonGroup>
        <Chip icon={<FiZap size={12}/>} label={`${filtered.filter(l=>l.health==='Hot').length} hot`} size="small" sx={{ bgcolor:'#FEF3C2', fontWeight:600, height:22 }} />
        {duplicateCount>0 && <Chip icon={<FiAlertTriangle size={12}/>} label={`${duplicateCount} duplicates`} color="warning" size="small" sx={{ height:22 }} />}
        <Box sx={{ flex:1 }}/>
        <Button variant="contained" startIcon={<FiPlus size={14}/>} onClick={onCreate} sx={{ bgcolor:'#14286D', textTransform:'none', borderRadius:2, fontWeight:700 }}>Add Lead</Button>
      </Paper>

      {selected.length>0 && (
        <Paper sx={{ p:1, mb:1.5, bgcolor:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:2, display:'flex', gap:1, alignItems:'center' }}>
          <Typography variant="caption" fontWeight={700}>{selected.length} selected</Typography>
          <Button size="small" variant="outlined" onClick={()=>{ selected.forEach(id=>{ const l=leads.find(x=>x.id===id); if(l) onConvert(l); }); setSelected([]); }}>Convert to Opp</Button>
          <Button size="small" color="error" onClick={()=>{ if(window.confirm(`Delete ${selected.length}?`)) selected.forEach(id=> onDelete(leads.find(x=>x.id===id))); setSelected([]); }}>Delete</Button>
          <Button size="small" onClick={()=>setSelected([])}>Clear</Button>
        </Paper>
      )}

      {view==='table' ? (
        <Paper sx={{ borderRadius:3, overflow:'hidden', border:'1px solid #E8EEF9' }}>
          <TableContainer sx={{ maxHeight:500 }}>
            <Table size="small" stickyHeader sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" align="center" sx={{ width: 44, py: 1.25 }}><Checkbox size="small" checked={filtered.length>0 && selected.length===filtered.length} indeterminate={selected.length>0 && selected.length<filtered.length} onChange={e=> setSelected(e.target.checked? filtered.map(x=>x.id): [])} /></TableCell>
                  <TableCell align="left" sx={{ py: 1.25 }}>Lead</TableCell>
                  <TableCell align="left" sx={{ py: 1.25 }}>Account</TableCell>
                  <TableCell align="center" sx={{ width: 100, py: 1.25 }}>Source</TableCell>
                  <TableCell align="center" sx={{ width: 120, py: 1.25 }}>Status</TableCell>
                  <TableCell align="center" sx={{ width: 100, py: 1.25 }}>Health</TableCell>
                  <TableCell align="center" sx={{ width: 100, py: 1.25 }}>Score</TableCell>
                  <TableCell align="right" sx={{ width: 100, py: 1.25 }}>Value</TableCell>
                  <TableCell align="left" sx={{ py: 1.25 }}>Next Action</TableCell>
                  <TableCell align="center" sx={{ width: 120, py: 1.25 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(l=>(
                  <TableRow key={l.id} hover selected={selected.includes(l.id)} sx={{ bgcolor: l.isDuplicate? '#FFFBEB': undefined }}>
                    <TableCell padding="checkbox" align="center"><Checkbox size="small" checked={selected.includes(l.id)} onChange={()=>toggleSelect(l.id)} /></TableCell>
                    <TableCell align="left">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width:30, height:30, fontSize:12, bgcolor: l.health==='Hot'?'#FEE2E2': l.health==='Warm'?'#FEF3C2':'#E0E7FF', color: healthColor(l.health) }}>{`${l.firstName[0]}${l.lastName[0]}`}</Avatar>
                        <Box>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontWeight={700} fontSize={13}>{l.firstName} {l.lastName}</Typography>
                            {l.isDuplicate && <Tooltip title="Duplicate email"><Chip icon={<FiAlertTriangle size={10}/>} label="Dup" size="small" color="warning" sx={{ height:16, fontSize:9 }}/></Tooltip>}
                            {l.tags?.slice(0,1).map(t=> <Chip key={t} icon={<FiTag size={10}/>} label={t} size="small" sx={{ height:16, fontSize:9, bgcolor:'#EEF2FF' }}/>)}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">{l.email||'—'} {l.phone? `• ${l.phone}`:''}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="left"><Typography fontSize={12}>{l.accountName||'—'}</Typography><Typography variant="caption" color="text.secondary">{l.nextFollowUp? `Follow: ${l.nextFollowUp}`:''}</Typography></TableCell>
                    <TableCell align="center"><Chip size="small" label={l.source} sx={{ height:18, fontSize:11, bgcolor:'#F1F5F9' }}/></TableCell>
                    <TableCell align="center"><Chip size="small" label={l.status} sx={{ bgcolor: LEAD_STATUS_COLOR[l.status]||'#EEF2FF', height:20, fontWeight:600, fontSize:11, border: l.status==='Converted'? '1px solid #16A34A':undefined }}/></TableCell>
                    <TableCell align="center"><Chip icon={<FiZap size={10}/>} label={l.health||'Warm'} size="small" sx={{ bgcolor: healthBg(l.health), color: healthColor(l.health), height:20, fontWeight:700, fontSize:11 }}/></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.7 }}>
                        <Box sx={{ width:50, height:6, bgcolor:'#E2E8F0', borderRadius:1, overflow:'hidden' }}><Box sx={{ width:`${l.healthScore||l.score}%`, height:'100%', bgcolor: (l.healthScore||l.score)>70?'#16A34A': (l.healthScore||l.score)>45?'#F59E0B':'#EF4444' }}/></Box>
                        <Typography variant="caption" fontWeight={700}>{l.healthScore||l.score}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right"><Typography fontWeight={700} fontSize={12}>${Number(l.value).toLocaleString()}</Typography></TableCell>
                    <TableCell align="left" sx={{ maxWidth:140 }}><Tooltip title={l.nextAction||''}><Typography variant="caption" sx={{ display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden', fontSize:11, color:'#475569' }}>{l.nextAction||'—'}</Typography></Tooltip></TableCell>
                    <TableCell align="center">
                      <Tooltip title={l.nextAction}><IconButton size="small" onClick={()=>onConvert(l)} sx={{ color:'#16A34A', bgcolor: l.health==='Hot'?'#DCFCE7':undefined }}><FiArrowRight size={14}/></IconButton></Tooltip>
                      <IconButton size="small" onClick={()=>onEdit(l)}><FiEdit2 size={14}/></IconButton>
                      <IconButton size="small" color="error" onClick={()=>onDelete(l)}><FiTrash2 size={14}/></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length===0 && <TableRow><TableCell colSpan={10} align="center" sx={{ py:3 }}><Typography color="text.secondary">No leads — try different filters</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Box sx={{ display:'flex', gap:1.5, overflowX:'auto', pb:1 }}>
          {LEAD_STATUSES.map(statusName=>(
            <Paper key={statusName} sx={{ minWidth:280, maxWidth:300, flexShrink:0, bgcolor:'#F8FAFD', border:'1px solid #E8EEF9', borderRadius:3, display:'flex', flexDirection:'column' }}>
              <Box sx={{ p:1.2, bgcolor:'#fff', borderBottom:'1px solid #E8EEF9', borderTopLeftRadius:12, borderTopRightRadius:12, display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor: LEAD_STATUS_COLOR[statusName]||'#94A3B8' }} />
                <Typography fontWeight={800} fontSize={12}>{statusName}</Typography>
                <Chip label={filtered.filter(l=>l.status===statusName).length} size="small" sx={{ ml:'auto', height:18, fontSize:10 }}/>
              </Box>
              <Box sx={{ p:1, flex:1, display:'flex', flexDirection:'column', gap:1, minHeight:300 }}>
                {filtered.filter(l=>l.status===statusName).map(l=>(
                  <Paper key={l.id} elevation={1} sx={{ p:1.2, borderRadius:2, borderLeft: l.health==='Hot'? '3px solid #EF4444': '3px solid #E8EEF9' }}>
                    <Typography fontWeight={700} fontSize={13}>{l.firstName} {l.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.accountName||'No account'} • {l.source}</Typography>
                    <Box sx={{ display:'flex', gap:0.5, mt:0.5, flexWrap:'wrap' }}>
                      <Chip label={l.health} size="small" sx={{ height:16, fontSize:10, bgcolor: healthBg(l.health), color: healthColor(l.health) }}/>
                      <Chip label={`$${Number(l.value).toLocaleString()}`} size="small" sx={{ height:16, fontSize:10 }}/>
                      {l.isDuplicate && <Chip label="Dup" size="small" color="warning" sx={{ height:16, fontSize:10 }}/>}
                    </Box>
                    <Typography variant="caption" sx={{ display:'block', mt:0.5, color:'#475569', fontSize:10 }}>{l.nextAction}</Typography>
                  </Paper>
                ))}
                {filtered.filter(l=>l.status===statusName).length===0 && <Typography variant="caption" color="text.secondary" sx={{ textAlign:'center', py:2 }}>Empty</Typography>}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
