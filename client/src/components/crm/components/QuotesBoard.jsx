import React, { useState } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip, TextField, IconButton, Typography, Stack } from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFileText, FiDollarSign } from 'react-icons/fi';

export default function QuotesBoard({ quotes, accounts, opps, onCreate, onEdit, onDelete }){
  const [q,setQ]=useState('');
  const filtered = quotes.filter(x=> !q || `${x.title} ${x.status}`.toLowerCase().includes(q.toLowerCase()));
  const accName = (id)=> accounts.find(a=>a.id===id)?.name || '—';
  const oppTitle = (id)=> opps.find(o=>o.id===id)?.title || '—';
  const statusColor = (s)=> s==='Accepted'?'success': s==='Sent'?'info': s==='Rejected'?'error':'default';
  return (
    <Paper sx={{ borderRadius:3, border:'1px solid #E8EEF9', overflow:'hidden' }}>
      <Box sx={{ p:2, display:'flex', gap:1, alignItems:'center', flexWrap:'wrap', borderBottom:'1px solid #EEF2FA' }}>
        <TextField size="small" placeholder="Search quotes..." value={q} onChange={e=>setQ(e.target.value)} InputProps={{ startAdornment:<FiSearch style={{ marginRight:6 }}/> }} sx={{ minWidth:240 }} />
        <Box sx={{ flex:1 }}/>
        <Chip label={`${filtered.length} quotes`} size="small" sx={{ bgcolor:'#FEF3C2' }}/>
        <Button variant="contained" startIcon={<FiPlus size={14}/>} onClick={onCreate} sx={{ bgcolor:'#14286D', textTransform:'none', borderRadius:2 }}>New Quote</Button>
      </Box>
      <TableContainer sx={{ maxHeight:440 }}>
        <Table size="small" stickyHeader>
          <TableHead><TableRow><TableCell>Quote</TableCell><TableCell>Opportunity</TableCell><TableCell>Account</TableCell><TableCell align="right">Amount</TableCell><TableCell>Discount</TableCell><TableCell>Status</TableCell><TableCell>Valid Until</TableCell><TableCell align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {filtered.map(x=>(
              <TableRow key={x.id} hover>
                <TableCell><Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width:30, height:30, borderRadius:1.5, bgcolor:'#E0F2FE', display:'flex', alignItems:'center', justifyContent:'center' }}><FiFileText size={14} color="#0284C7"/></Box><Box><Typography fontWeight={700} fontSize={13}>{x.title}</Typography><Typography variant="caption" color="text.secondary">#{x.id}</Typography></Box></Stack></TableCell>
                <TableCell>{oppTitle(x.opportunityId)}</TableCell>
                <TableCell>{accName(x.accountId)}</TableCell>
                <TableCell align="right"><Typography fontWeight={700} fontSize={13}>${Number(x.amount).toLocaleString()}</Typography></TableCell>
                <TableCell>{x.discount? `${x.discount}%`:'—'}</TableCell>
                <TableCell><Chip size="small" label={x.status} color={statusColor(x.status)} sx={{ height:18, fontSize:11, fontWeight:600 }}/></TableCell>
                <TableCell>{x.validUntil? new Date(x.validUntil).toLocaleDateString(): '—'}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={()=>onEdit(x)}><FiEdit2 size={14}/></IconButton>
                  <IconButton size="small" color="error" onClick={()=>onDelete(x)}><FiTrash2 size={14}/></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py:3 }}><Typography color="text.secondary">No quotes</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
