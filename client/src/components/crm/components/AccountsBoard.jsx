import React, { useState } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip, TextField, IconButton, Tooltip, Avatar, Typography, Stack } from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiGlobe } from 'react-icons/fi';

export default function AccountsBoard({ accounts, onCreate, onEdit, onDelete }){
  const [q,setQ]=useState('');
  const filtered = accounts.filter(a=> !q || `${a.name} ${a.industry} ${a.city}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Paper sx={{ borderRadius:3, border:'1px solid #E8EEF9', overflow:'hidden' }}>
      <Box sx={{ p:2, display:'flex', gap:1, alignItems:'center', borderBottom:'1px solid #EEF2FA' }}>
        <TextField size="small" placeholder="Search accounts..." value={q} onChange={e=>setQ(e.target.value)} InputProps={{ startAdornment:<FiSearch style={{ marginRight:6 }}/> }} sx={{ minWidth:220 }} />
        <Box sx={{ flex:1 }}/>
        <Button variant="contained" startIcon={<FiPlus size={14}/>} onClick={onCreate} sx={{ bgcolor:'#14286D', textTransform:'none', borderRadius:2 }}>Add Account</Button>
      </Box>
      <TableContainer sx={{ maxHeight:420 }}>
        <Table size="small" stickyHeader sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ py: 1.25 }}>Account</TableCell>
              <TableCell align="center" sx={{ width: 140, py: 1.25 }}>Industry</TableCell>
              <TableCell align="center" sx={{ width: 110, py: 1.25 }}>Size</TableCell>
              <TableCell align="left" sx={{ width: 140, py: 1.25 }}>City</TableCell>
              <TableCell align="center" sx={{ width: 110, py: 1.25 }}>Owner</TableCell>
              <TableCell align="center" sx={{ width: 110, py: 1.25 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(a=>(
              <TableRow key={a.id} hover>
                <TableCell align="left">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width:30, height:30, bgcolor:'#EEF2FF', color:'#3730A3', fontSize:12 }}><FiGlobe size={14}/></Avatar>
                    <Box><Typography fontWeight={700} fontSize={13}>{a.name}</Typography><Typography variant="caption" color="text.secondary">{a.website||'—'}</Typography></Box>
                  </Stack>
                </TableCell>
                <TableCell align="center"><Chip size="small" label={a.industry||'General'} sx={{ height:18, fontSize:11 }}/></TableCell>
                <TableCell align="center">{a.size||'—'}</TableCell>
                <TableCell align="left">{a.city||'—'}</TableCell>
                <TableCell align="center">{a.ownerId||'—'}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={()=>onEdit(a)}><FiEdit2 size={14}/></IconButton>
                  <IconButton size="small" color="error" onClick={()=>onDelete(a)}><FiTrash2 size={14}/></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py:3 }}><Typography color="text.secondary">No accounts</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
