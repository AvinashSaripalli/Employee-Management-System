import React, { useState } from 'react';
import { Box, Paper, Typography, Chip, Card, CardContent, IconButton, Tooltip, TextField, Stack, LinearProgress } from '@mui/material';
import { FiEye, FiEdit2, FiTrash2, FiDollarSign, FiCalendar, FiAlertTriangle, FiClock, FiTrendingUp } from 'react-icons/fi';
import { OPP_STAGES, STAGE_COLOR } from '../utils/crmConstants';

const WIP_LIMIT = 5;

export default function PipelineKanban({ opps, onEdit, onDelete, onView, onStageChange }){
  const cols = OPP_STAGES.map(s=> ({ stage:s, color: STAGE_COLOR[s], items: opps.filter(o=>o.stage===s) }));
  const handleDrop=(e, stage)=>{
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const opp = opps.find(o=> String(o.id)===id);
    if(opp && opp.stage!==stage) onStageChange(opp, stage);
  };
  const [editingAmount, setEditingAmount] = useState(null);
  const [amountDraft, setAmountDraft] = useState('');

  return (
    <Box sx={{ display:'flex', gap:1.5, overflowX:'auto', pb:1 }}>
      {cols.map(col=>{
        const total = col.items.reduce((s,o)=> s+Number(o.amount||0),0);
        const weighted = col.items.reduce((s,o)=> s+Number(o.weighted|| Math.round(Number(o.amount||0)*Number(o.probability||0)/100)),0);
        const isOverWIP = col.items.length > WIP_LIMIT && !['Closed Won','Closed Lost'].includes(col.stage);
        return (
          <Paper key={col.stage} onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e,col.stage)} elevation={0} sx={{ minWidth:310, maxWidth:330, flexShrink:0, bgcolor: isOverWIP? '#FFFBEB':'#F8FAFD', border: isOverWIP? '2px solid #F59E0B':'1px solid #E8EEF9', borderRadius:3, display:'flex', flexDirection:'column' }}>
            <Box sx={{ p:1.2, bgcolor:'#fff', borderBottom:'1px solid #E8EEF9', borderTopLeftRadius:12, borderTopRightRadius:12 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:col.color }} />
                <Typography fontWeight={800} fontSize={12}>{col.stage}</Typography>
                <Chip label={`${col.items.length}/${WIP_LIMIT}`} size="small" color={isOverWIP?'warning':'default'} sx={{ ml:'auto', height:18, fontSize:10, fontWeight:700 }} />
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt:0.7 }}>
                <Chip size="small" icon={<FiDollarSign size={10}/>} label={`$${total.toLocaleString()}`} sx={{ height:16, fontSize:9, bgcolor:'#EEF2FF' }} />
                <Chip size="small" icon={<FiTrendingUp size={10}/>} label={`W $${weighted.toLocaleString()}`} sx={{ height:16, fontSize:9, bgcolor:'#DCFCE7', color:'#166534' }} />
                {isOverWIP && <Chip icon={<FiAlertTriangle size={10}/>} label="WIP" size="small" color="warning" sx={{ height:16, fontSize:9 }}/>}
              </Stack>
            </Box>
            <Box sx={{ p:1, flex:1, display:'flex', flexDirection:'column', gap:1, minHeight:420, overflowY:'auto' }}>
              {col.items.length===0? <Typography variant="caption" color="text.secondary" sx={{ textAlign:'center', py:3 }}>Drag deals here</Typography> :
                col.items.map(o=>{
                  const isRotting = o.isRotting;
                  const health = o.healthScore||75;
                  return (
                    <Card key={o.id} draggable onDragStart={e=> e.dataTransfer.setData('text/plain', String(o.id))} sx={{ borderRadius:2, cursor:'grab', borderLeft:`4px solid ${isRotting? '#EF4444': col.color}`, boxShadow: isRotting? '0 0 0 1px #FEE2E2': undefined, opacity: o.stage==='Closed Lost'?0.7:1 }}>
                      <CardContent sx={{ p:1.2, '&:last-child':{ pb:1.2 } }}>
                        <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:1 }}>
                          <Typography fontWeight={700} fontSize={13} sx={{ flex:1, lineHeight:1.2 }} noWrap>{o.title}</Typography>
                          <Chip label={`${o.probability}%`} size="small" sx={{ height:16, fontSize:9, bgcolor: o.probability>70?'#DCFCE7': o.probability>40?'#FEF3C2':'#F1F5F9', fontWeight:700 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">#{o.id} • {o.assignedTo||'Unassigned'} {o.forecastCategory? `• ${o.forecastCategory}`:''}</Typography>
                        {o.competitors && <Typography variant="caption" sx={{ display:'block', color:'#DC2626', fontSize:10 }}>vs {o.competitors}</Typography>}
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.7, mt:0.7, flexWrap:'wrap' }}>
                          {editingAmount===o.id ? (
                            <Box sx={{ display:'flex', gap:0.5, alignItems:'center' }}>
                              <TextField size="small" type="number" value={amountDraft} onChange={e=>setAmountDraft(e.target.value)} sx={{ width:100 }} />
                              <Chip label="Save" size="small" clickable onClick={()=>{ onStageChange(o, o.stage); setEditingAmount(null); }} sx={{ height:20, bgcolor:'#14286D', color:'#fff' }} />
                              <Chip label="X" size="small" clickable onClick={()=>setEditingAmount(null)} sx={{ height:20 }} />
                            </Box>
                          ) : (
                            <Chip icon={<FiDollarSign size={10}/>} label={`$${Number(o.amount).toLocaleString()}`} size="small" onClick={()=>{ setEditingAmount(o.id); setAmountDraft(String(o.amount)); }} sx={{ height:18, fontSize:11, bgcolor:'#DCFCE7', color:'#166534', cursor:'pointer' }} />
                          )}
                          <Chip icon={<FiClock size={10}/>} label={`${o.daysInStage||0}d`} size="small" color={isRotting?'error':undefined} sx={{ height:18, fontSize:10, bgcolor: isRotting?'#FEE2E2':undefined }} />
                          <Chip label={`${o.healthScore||75}♥`} size="small" sx={{ height:18, fontSize:10, bgcolor: health>70?'#DCFCE7': health>40?'#FEF3C2':'#FEE2E2', color: health>70?'#166534': health>40?'#92400E':'#991B1B' }} />
                          {o.closeDate && <Chip icon={<FiCalendar size={10}/>} label={new Date(o.closeDate).toLocaleDateString()} size="small" sx={{ height:18, fontSize:10 }} />}
                        </Box>
                        {isRotting && <Box sx={{ mt:0.7, display:'flex', alignItems:'center', gap:0.5, color:'#DC2626' }}><FiAlertTriangle size={11}/><Typography variant="caption" fontWeight={700} fontSize={10}>Rotting • {o.daysInStage}d in stage</Typography></Box>}
                        {o.lossReason && <Typography variant="caption" sx={{ display:'block', mt:0.4, color:'#DC2626', fontSize:10 }}>Loss: {o.lossReason}</Typography>}
                        <Box sx={{ display:'flex', justifyContent:'flex-end', gap:0.5, mt:0.8 }}>
                          <Tooltip title="View"><IconButton size="small" onClick={()=>onView(o)} sx={{ width:24, height:24 }}><FiEye size={12}/></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={()=>onEdit(o)} sx={{ width:24, height:24 }}><FiEdit2 size={12}/></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={()=>onDelete(o)} sx={{ width:24, height:24 }}><FiTrash2 size={12}/></IconButton></Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
