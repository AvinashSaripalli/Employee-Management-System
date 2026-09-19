import React from 'react';
import { Box, Paper, Typography, Chip, Card, CardContent, Avatar, IconButton, Tooltip } from '@mui/material';
import { FiEye, FiEdit2, FiTrash2, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { OPP_STAGES, STAGE_COLOR } from '../utils/crmConstants';

export default function PipelineKanban({ opps, onEdit, onDelete, onView, onStageChange }){
  const cols = OPP_STAGES.map(s=> ({ stage:s, color: STAGE_COLOR[s], items: opps.filter(o=>o.stage===s) }));
  const handleDrop=(e, stage)=>{
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const opp = opps.find(o=> String(o.id)===id);
    if(opp && opp.stage!==stage) onStageChange(opp, stage);
  };
  return (
    <Box sx={{ display:'flex', gap:1.5, overflowX:'auto', pb:1 }}>
      {cols.map(col=>{
        const total = col.items.reduce((s,o)=> s+Number(o.amount||0),0);
        return (
          <Paper key={col.stage} onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e,col.stage)} elevation={0} sx={{ minWidth:300, maxWidth:320, flexShrink:0, bgcolor:'#F8FAFD', border:'1px solid #E8EEF9', borderRadius:3, display:'flex', flexDirection:'column' }}>
            <Box sx={{ p:1.2, bgcolor:'#fff', borderBottom:'1px solid #E8EEF9', borderTopLeftRadius:12, borderTopRightRadius:12, display:'flex', alignItems:'center', gap:1 }}>
              <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:col.color }} />
              <Typography fontWeight={800} fontSize={12}>{col.stage}</Typography>
              <Chip label={col.items.length} size="small" sx={{ ml:'auto', height:18, fontSize:10 }} />
              <Typography variant="caption" color="text.secondary">${total.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ p:1, flex:1, display:'flex', flexDirection:'column', gap:1, minHeight:400, overflowY:'auto' }}>
              {col.items.length===0? <Typography variant="caption" color="text.secondary" sx={{ textAlign:'center', py:3 }}>Empty</Typography> :
                col.items.map(o=>(
                  <Card key={o.id} draggable onDragStart={e=> e.dataTransfer.setData('text/plain', String(o.id))} sx={{ borderRadius:2, cursor:'grab', borderLeft:`4px solid ${col.color}` }}>
                    <CardContent sx={{ p:1.2, '&:last-child':{ pb:1.2 } }}>
                      <Typography fontWeight={700} fontSize={13} noWrap>{o.title}</Typography>
                      <Typography variant="caption" color="text.secondary">#{o.id} • {o.assignedTo||'Unassigned'}</Typography>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:1 }}>
                        <Chip icon={<FiDollarSign size={10}/>} label={`$${Number(o.amount).toLocaleString()}`} size="small" sx={{ height:18, fontSize:11, bgcolor:'#DCFCE7', color:'#166534' }} />
                        <Chip label={`${o.probability}%`} size="small" sx={{ height:18, fontSize:10 }} />
                        {o.closeDate && <Chip icon={<FiCalendar size={10}/>} label={new Date(o.closeDate).toLocaleDateString()} size="small" sx={{ height:18, fontSize:10 }} />}
                      </Box>
                      <Box sx={{ display:'flex', justifyContent:'flex-end', gap:0.5, mt:1 }}>
                        <IconButton size="small" onClick={()=>onView(o)}><FiEye size={13}/></IconButton>
                        <IconButton size="small" onClick={()=>onEdit(o)}><FiEdit2 size={13}/></IconButton>
                        <IconButton size="small" onClick={()=>onDelete(o)}><FiTrash2 size={13}/></IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
