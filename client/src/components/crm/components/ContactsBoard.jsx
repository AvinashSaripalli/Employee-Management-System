import React, { useState } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip, TextField, IconButton, Tooltip, Avatar, Typography, Stack } from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMail, FiPhone, FiStar } from 'react-icons/fi';

export default function ContactsBoard({ contacts, accounts, onCreate, onEdit, onDelete }){
  const [q,setQ]=useState('');
  const filtered = contacts.filter(c=> !q || `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  const accountName = (id)=> accounts.find(a=>a.id===id)?.name || '—';
  return (
    <Paper sx={{ borderRadius:3, border:'1px solid #E8EEF9', overflow:'hidden' }}>
      <Box sx={{ p:2, display:'flex', gap:1, alignItems:'center', borderBottom:'1px solid #EEF2FA', flexWrap:'wrap' }}>
        <TextField size="small" placeholder="Search contacts..." value={q} onChange={e=>setQ(e.target.value)} InputProps={{ startAdornment:<FiSearch style={{ marginRight:6 }}/> }} sx={{ minWidth:240 }} />
        <Box sx={{ flex:1 }}/>
        <Chip label={`${filtered.length} contacts`} size="small" sx={{ bgcolor:'#EEF2FF' }}/>
        <Button variant="contained" startIcon={<FiPlus size={14}/>} onClick={onCreate} sx={{ bgcolor:'#14286D', textTransform:'none', borderRadius:2 }}>Add Contact</Button>
      </Box>
      <TableContainer sx={{ maxHeight:440 }}>
        <Table size="small" stickyHeader>
          <TableHead><TableRow><TableCell>Contact</TableCell><TableCell>Account</TableCell><TableCell>Title</TableCell><TableCell>Contact</TableCell><TableCell>Owner</TableCell><TableCell align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {filtered.map(c=>(
              <TableRow key={c.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width:30, height:30, bgcolor: c.isPrimary? '#FEF3C2':'#E0E7FF', color: c.isPrimary? '#D97706':'#4338CA', fontSize:12 }}>{`${c.firstName[0]}${c.lastName[0]}`}</Avatar>
                    <Box><Typography fontWeight={700} fontSize={13}>{c.firstName} {c.lastName} {c.isPrimary && <FiStar size={10} color="#F59E0B"/>}</Typography><Typography variant="caption" color="text.secondary">{c.email||'—'}</Typography></Box>
                  </Stack>
                </TableCell>
                <TableCell><Chip size="small" label={accountName(c.accountId)} sx={{ height:18, fontSize:11 }}/></TableCell>
                <TableCell>{c.title||'—'}</TableCell>
                <TableCell><Stack spacing={0.3}><Typography variant="caption" sx={{ display:'flex', alignItems:'center', gap:0.5 }}><FiMail size={10}/> {c.email||'—'}</Typography><Typography variant="caption" sx={{ display:'flex', alignItems:'center', gap:0.5 }}><FiPhone size={10}/> {c.phone||'—'}</Typography></Stack></TableCell>
                <TableCell>{c.ownerId||'—'}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={()=>onEdit(c)}><FiEdit2 size={14}/></IconButton>
                  <IconButton size="small" color="error" onClick={()=>onDelete(c)}><FiTrash2 size={14}/></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py:3 }}><Typography color="text.secondary">No contacts</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
