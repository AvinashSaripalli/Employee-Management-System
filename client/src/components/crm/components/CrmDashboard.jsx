import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Stack } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { FiTrendingUp, FiUsers, FiBriefcase, FiDollarSign, FiActivity, FiTarget } from 'react-icons/fi';

const Stat = ({ icon, label, value, sub, color, tint })=>(
  <Paper sx={{ p:2, borderRadius:3, display:'flex', gap:1.5, alignItems:'center', border:'1px solid #E8EEF9' }}>
    <Box sx={{ width:44, height:44, borderRadius:2, bgcolor:tint, color, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</Box>
    <Box><Typography fontWeight={800} fontSize={18}>{value}</Typography><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="caption" sx={{ display:'block', fontSize:10 }}>{sub}</Typography></Box>
  </Paper>
);

export default function CrmDashboard({ stats }){
  if(!stats) return <Typography>Loading...</Typography>;
  const funnel = stats.opportunities.funnel.map(f=> ({ name: f.stage, value: f.count, fill: f.stage==='Closed Won'?'#16A34A': f.stage==='Closed Lost'?'#EF4444':'#38BDF8' }));
  const sourceData = Object.entries(stats.leads.bySource||{}).map(([name,value])=>({name, value}));
  const COLORS=['#14286D','#38BDF8','#F59E0B','#8B5CF6','#16A34A','#EF4444'];
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={12} sm={6} md={2.4}><Stat icon={<FiUsers size={20}/>} label="Leads" value={stats.leads.total} sub={`${stats.leads.converted} converted`} color="#14286D" tint="#E0E7FF" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><Stat icon={<FiBriefcase size={20}/>} label="Opportunities" value={stats.opportunities.total} sub={`${stats.opportunities.won} won • ${stats.opportunities.lost} lost`} color="#0284C7" tint="#E0F2FE" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><Stat icon={<FiDollarSign size={20}/>} label="Pipeline Value" value={`$${Number(stats.opportunities.totalValue).toLocaleString()}`} sub={`Avg $${stats.opportunities.avgDeal.toLocaleString()}`} color="#16A34A" tint="#DCFCE7" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><Stat icon={<FiTarget size={20}/>} label="Win Rate" value={`${stats.opportunities.total? Math.round(stats.opportunities.won/stats.opportunities.total*100):0}%`} sub="Closed Won / total" color="#8B5CF6" tint="#F5F3FF" /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><Stat icon={<FiActivity size={20}/>} label="Activities" value={stats.activities.total} sub={`${stats.activities.pending} pending • ${stats.activities.overdue} overdue`} color="#F59E0B" tint="#FEF3C2" /></Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
            <Typography fontWeight={700} sx={{ mb:1 }}>Pipeline Funnel</Typography>
            <Box sx={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.opportunities.funnel} layout="vertical" margin={{ left:20, right:20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="stage" type="category" width={90} tick={{ fontSize:11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14286D" radius={[0,8,8,0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
            <Typography fontWeight={700} sx={{ mb:1 }}>Leads by Source</Typography>
            <Box sx={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90} label={({name,value})=>`${name}:${value}`}>
                    {sourceData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
            <Typography fontWeight={700} sx={{ mb:1 }}>Value by Stage</Typography>
            <Box sx={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.opportunities.funnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize:10 }} angle={-20} height={50} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16A34A" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
