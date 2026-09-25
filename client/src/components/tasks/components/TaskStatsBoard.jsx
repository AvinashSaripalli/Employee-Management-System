import React from 'react';
import { Box, Paper, Typography, Avatar, Grid, Chip } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { FiClipboard, FiCheckCircle, FiClock, FiAlertTriangle, FiUsers, FiBarChart2 } from 'react-icons/fi';
import { STATUS_META } from '../utils/taskConstants';

const STATUS_COLORS = { 1:'#94A3B8',2:'#0284C7',3:'#F59E0B',4:'#8B5CF6',5:'#16A34A',6:'#64748B',7:'#E11D48' };
const PRIORITY_COLORS = {0:'#94A3B8',1:'#0284C7',2:'#E11D48'};

const StatTile = ({ icon, label, value, sub, color, tint })=>(
  <Paper sx={{ p:2, borderRadius:3, display:'flex', alignItems:'center', gap:1.5, border:'1px solid #E8EEF9' }}>
    <Box sx={{ width:48, height:48, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', bgcolor:tint, color }}>{icon}</Box>
    <Box><Typography variant="h6" fontWeight={800}>{value}</Typography><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="caption" color="text.secondary" sx={{ display:'block', fontSize:10 }}>{sub}</Typography></Box>
  </Paper>
);

export default function TaskStatsBoard({ stats, onView, isAdmin, isSupervisor, isEmployee, userDepartment }){
  const statusData = stats.byStatus.filter(d=>d.count>0).map(d=>({ name: STATUS_META[d.status].label, value:d.count, color: STATUS_COLORS[d.status]}));
  const workloadData = stats.workload.map(w=>({ name:w.name, Done:w.completed, Pending:w.pending }));

  const tiles = isEmployee ? [
    { icon:<FiClipboard size={22}/>, label:'My Total Tasks', value:stats.total, sub:'all assigned & created', color:'#14286D', tint:'#E2E7F5'},
    { icon:<FiCheckCircle size={22}/>, label:'Completed', value:stats.completed, sub:`${stats.completionRate}% completion`, color:'#16A34A', tint:'#E7F6EC'},
    { icon:<FiClock size={22}/>, label:'In Progress', value:stats.inProgress, sub:'currently working', color:'#D97706', tint:'#FEF3E2'},
    { icon:<FiAlertTriangle size={22}/>, label:'Overdue', value:stats.overdue, sub:'past deadline', color:'#E11D48', tint:'#FDECF0'},
    { icon:<FiUsers size={22}/>, label:'Assigned to Me', value:stats.myTasks, sub:'direct responsibility', color:'#7C3AED', tint:'#F1E9FC'},
  ] : [
    { icon:<FiClipboard size={22}/>, label: isSupervisor ? `${userDepartment} Total` : 'Organization Total', value:stats.total, sub:`${stats.myTasks} yours`, color:'#14286D', tint:'#E2E7F5'},
    { icon:<FiCheckCircle size={22}/>, label:'Completed', value:stats.completed, sub:`${stats.completionRate}% rate`, color:'#16A34A', tint:'#E7F6EC'},
    { icon:<FiClock size={22}/>, label:'In Progress', value:stats.inProgress, sub:'active', color:'#D97706', tint:'#FEF3E2'},
    { icon:<FiAlertTriangle size={22}/>, label:'Overdue', value:stats.overdue, sub:'past deadline', color:'#E11D48', tint:'#FDECF0'},
    { icon:<FiUsers size={22}/>, label:'My Tasks', value:stats.myTasks, sub:'personal assigned', color:'#7C3AED', tint:'#F1E9FC'},
  ];

  if(stats.total===0) return (
    <Paper sx={{ p:6, textAlign:'center', borderRadius:3, border:'1px solid #E8EEF9' }}>
      <FiBarChart2 size={48} color="#C9D6EE"/>
      <Typography fontWeight={700} sx={{ mt:1 }}>No task statistics yet</Typography>
      <Typography variant="caption" color="text.secondary">Statistics will populate once tasks are assigned or active.</Typography>
    </Paper>
  );

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb:2 }}>
        {tiles.map(t=> <Grid item xs={12} sm={6} md={2.4} key={t.label}><StatTile {...t}/></Grid>)}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
            <Typography fontWeight={700} sx={{ mb:1 }}>
              {isEmployee ? 'My Tasks History (Last 12 Months)' : isSupervisor ? `${userDepartment} Tasks Activity (12 Months)` : 'Organization Tasks Trend (12 Months)'}
            </Typography>
            <Box sx={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2FA" />
                  <XAxis dataKey="name" tick={{ fontSize:11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize:11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stroke="#14286D" fill="#E2E7F5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
            <Typography fontWeight={700} sx={{ mb:1 }}>By Status</Typography>
            <Box sx={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} label={({name, value})=> `${name}:${value}`}>
                    {statusData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        {!isEmployee && workloadData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
              <Typography fontWeight={700} sx={{ mb:1 }}>
                {isSupervisor ? `${userDepartment} Team Workload by Member` : 'Workload by Assignee'}
              </Typography>
              <Box sx={{ height: Math.max(260, workloadData.length * 45) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} layout="vertical" margin={{ left:10, right:30, top:10, bottom:10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false}/>
                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize:11 }}/>
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Done" stackId="a" fill="#16A34A" radius={[0,0,0,0]} />
                    <Bar dataKey="Pending" stackId="a" fill="#94A3B8" radius={[0,10,10,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      {stats.overdueList.length>0 && (
        <Paper sx={{ mt:2, p:2, borderRadius:3, border:'1px solid #FECACA', bgcolor:'#FFF7F7' }}>
          <Typography fontWeight={700} color="#DC2626" sx={{ mb:1, display:'flex', alignItems:'center', gap:1 }}><FiAlertTriangle size={16}/> Overdue Tasks ({stats.overdueList.length})</Typography>
          <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
            {stats.overdueList.slice(0,8).map(t=> (
              <Chip
                key={t.id}
                label={`${t.title} • ${t.respName ? t.respName + ' • ' : ''}${t.daysOver}d overdue`}
                onClick={()=> onView(t)}
                size="small"
                color="error"
                variant="outlined"
                sx={{ cursor:'pointer', fontWeight: 600, py: 0.5 }}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
