import React, { useState } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip, TextField, IconButton, Typography, Stack, Avatar } from '@mui/material';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiDollarSign } from 'react-icons/fi';

export default function ProductsBoard({ products, onCreate, onEdit, onDelete }){
  const [q,setQ]=useState('');
  const filtered = products.filter(p=> !q || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
  const margin = (p)=> p.price? Math.round((p.price - (p.cost||0))/p.price*100):0;
  return (
    <Paper sx={{ borderRadius:3, border:'1px solid #E8EEF9', overflow:'hidden' }}>
      <Box sx={{ p:2, display:'flex', gap:1, alignItems:'center', flexWrap:'wrap', borderBottom:'1px solid #EEF2FA' }}>
        <TextField size="small" placeholder="Search products..." value={q} onChange={e=>setQ(e.target.value)} InputProps={{ startAdornment:<FiSearch style={{ marginRight:6 }}/> }} sx={{ minWidth:240 }} />
        <Box sx={{ flex:1 }}/>
        <Chip label={`${filtered.length} products`} size="small" sx={{ bgcolor:'#DCFCE7' }}/>
        <Button variant="contained" startIcon={<FiPlus size={14}/>} onClick={onCreate} sx={{ bgcolor:'#14286D', textTransform:'none', borderRadius:2 }}>Add Product</Button>
      </Box>
      <TableContainer sx={{ maxHeight:440 }}>
        <Table size="small" stickyHeader>
          <TableHead><TableRow><TableCell>Product</TableCell><TableCell>SKU</TableCell><TableCell>Category</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Margin</TableCell><TableCell>Status</TableCell><TableCell align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {filtered.map(p=>(
              <TableRow key={p.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width:30, height:30, bgcolor:'#E0F2FE', color:'#0284C7' }}><FiPackage size={14}/></Avatar>
                    <Typography fontWeight={700} fontSize={13}>{p.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{p.sku||'—'}</Typography></TableCell>
                <TableCell><Chip size="small" label={p.category||'General'} sx={{ height:18, fontSize:11 }}/></TableCell>
                <TableCell align="right"><Typography fontWeight={700} fontSize={13} sx={{ display:'inline-flex', alignItems:'center', gap:0.3 }}><FiDollarSign size={11}/>{Number(p.price).toLocaleString()}</Typography></TableCell>
                <TableCell align="right"><Chip size="small" label={`${margin(p)}%`} color={margin(p)>40?'success': margin(p)>20?'warning':'default'} sx={{ height:18, fontSize:11 }}/></TableCell>
                <TableCell><Chip size="small" label={p.active?'Active':'Inactive'} color={p.active?'success':'default'} sx={{ height:18, fontSize:11 }}/></TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={()=>onEdit(p)}><FiEdit2 size={14}/></IconButton>
                  <IconButton size="small" color="error" onClick={()=>onDelete(p)}><FiTrash2 size={14}/></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py:3 }}><Typography color="text.secondary">No products</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
