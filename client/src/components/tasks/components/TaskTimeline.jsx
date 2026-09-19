import React, { useMemo } from 'react';
import { Box, Paper, Typography, Chip, Stack } from '@mui/material';
import { STATUS_META } from '../utils/taskConstants';
import { formatDeadline } from '../utils/taskHelpers';

export default function TaskTimeline({ tasks }) {
  const sorted = useMemo(()=> [...tasks].sort((a,b)=> new Date(a.deadline||a.createdAt) - new Date(b.deadline||b.createdAt)),[tasks]);

  // group by month
  const groups = useMemo(()=>{
    const map={};
    sorted.forEach(t=>{
      const d = t.deadline ? new Date(t.deadline) : new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if(!map[key]) map[key]=[];
      map[key].push(t);
    });
    return Object.entries(map).sort((a,b)=> a[0].localeCompare(b[0]));
  },[sorted]);

  if(sorted.length===0) return <Paper sx={{ p:6, textAlign:'center' }}><Typography color="text.secondary">No tasks to show on timeline</Typography></Paper>;

  return (
    <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
      {groups.map(([month, items])=>(
        <Paper key={month} sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
          <Typography fontWeight={800} fontSize={14} sx={{ mb:1.5, color:'#14286D' }}>{new Date(month+'-01').toLocaleString('en',{month:'long', year:'numeric'})} • {items.length} tasks</Typography>
          <Box sx={{ position:'relative', pl:2, borderLeft:'2px solid #E8EEF9' }}>
            {items.map(task=>(
              <Box key={task.id} sx={{ position:'relative', mb:1.5, ml:2 }}>
                <Box sx={{ position:'absolute', left:-26, top:6, width:12, height:12, borderRadius:'50%', bgcolor: STATUS_META[task.status]?.dot||'#94A3B8', border:'2px solid #fff', boxShadow:'0 0 0 2px #E8EEF9' }} />
                <Paper variant="outlined" sx={{ p:1.2, borderRadius:2, display:'flex', gap:1, alignItems:'center', flexWrap:'wrap' }}>
                  <Chip size="small" label={STATUS_META[task.status]?.label} sx={{ bgcolor: STATUS_META[task.status]?.bg, color: STATUS_META[task.status]?.dot, fontWeight:600, height:18, fontSize:10 }} />
                  <Typography fontWeight={600} fontSize={13} sx={{ flex:1, minWidth:120 }}>{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDeadline(task.deadline)}</Typography>
                  <Chip size="small" label={task.responsible? `${task.responsible.firstName} ${task.responsible.lastName}`: 'Unassigned'} sx={{ height:18, fontSize:10 }} />
                </Paper>
              </Box>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
