import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Stack, LinearProgress, Avatar } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FiTrendingUp, FiUsers, FiBriefcase, FiDollarSign, FiActivity, FiTarget, FiClock, FiAward, FiAlertCircle } from 'react-icons/fi';

const Stat = ({ icon, label, value, sub, color, tint })=>(
  <Paper sx={{ p:1.6, borderRadius:3, display:'flex', gap:1.2, alignItems:'center', border:'1px solid #E8EEF9', boxShadow:'0 2px 8px rgba(20,40,109,0.04)' }}>
    <Box sx={{ width:42, height:42, borderRadius:2, bgcolor:tint, color, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</Box>
    <Box><Typography fontWeight={800} fontSize={16} sx={{ lineHeight:1.1 }}>{value}</Typography><Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography><Typography variant="caption" sx={{ display:'block', fontSize:10, color:'#64748B' }}>{sub}</Typography></Box>
  </Paper>
);

export default function CrmDashboard({ stats }){
  if(!stats) return <Box sx={{ p:3 }}><Typography>Loading CRM...</Typography><LinearProgress sx={{ mt:1 }}/></Box>;
  const funnel = stats.opportunities.funnel;
  const sourceData = Object.entries(stats.leads.bySource||{}).map(([name,value])=>({name, value}));
  const stageValue = funnel.map(f=> ({ stage: f.stage, value: f.value, weighted: f.weighted }));
  const COLORS=['#14286D','#38BDF8','#F59E0B','#8B5CF6','#16A34A','#EF4444','#06B6D4'];
  const forecast = stats.opportunities.forecast||{ pipeline:0, commit:0, bestCase:0, closed:0 };

  return (
    <Box>
      {/* KPI */}
      <Grid container spacing={1.5} sx={{ mb:2 }}>
        <Grid item xs={12} sm={6} md={2}><Stat icon={<FiUsers size={18}/>} label="Leads" value={stats.leads.total} sub={`${stats.leads.converted} conv • ${stats.leads.hot||0} hot`} color="#14286D" tint="#E0E7FF" /></Grid>
        <Grid item xs={12} sm={6} md={2}><Stat icon={<FiBriefcase size={18}/>} label="Pipeline" value={`${stats.opportunities.total}`} sub={`${stats.opportunities.won}W/${stats.opportunities.lost}L`} color="#0284C7" tint="#E0F2FE" /></Grid>
        <Grid item xs={12} sm={6} md={2}><Stat icon={<FiDollarSign size={18}/>} label="Value" value={`$${Number(stats.opportunities.totalValue).toLocaleString()}`} sub={`Avg $${stats.opportunities.avgDeal.toLocaleString()}`} color="#16A34A" tint="#DCFCE7" /></Grid>
        <Grid item xs={12} sm={6} md={2}><Stat icon={<FiTrendingUp size={18}/>} label="Weighted" value={`$${Number(stats.opportunities.weighted).toLocaleString()}`} sub={`Forecast`} color="#7C3AED" tint="#F5F3FF" /></Grid>
        <Grid item xs={12} sm={6} md={2}><Stat icon={<FiTarget size={18}/>} label="Win Rate" value={`${stats.opportunities.total? Math.round(stats.opportunities.won/stats.opportunities.total*100):0}%`} sub={`Velocity ${stats.opportunities.velocity||0}%`} color="#8B5CF6" tint="#F5F3FF" /></Grid>
        <Grid item xs={12} sm={6} md={2}><Stat icon={<FiActivity size={18}/>} label="Activities" value={stats.activities.total} sub={`${stats.activities.pending} pend • ${stats.activities.overdue} over`} color="#F59E0B" tint="#FEF3C2" /></Grid>
      </Grid>

      {/* Forecast strip */}
      <Paper sx={{ p:1.5, mb:2, borderRadius:3, border:'1px solid #E8EEF9', bgcolor:'linear-gradient(90deg,#FFFFFF 0%, #F8FAFD 100%)', display:'flex', gap:1, flexWrap:'wrap', alignItems:'center' }}>
        <Typography fontWeight={800} fontSize={12} color="#0F172A" sx={{ display:'flex', alignItems:'center', gap:0.7 }}><FiAward size={14} color="#D97706"/> Forecast</Typography>
        <Chip size="small" label={`Pipeline $${forecast.pipeline.toLocaleString()}`} sx={{ bgcolor:'#EEF2FF', fontWeight:700, height:22 }} />
        <Chip size="small" label={`Commit $${forecast.commit.toLocaleString()}`} sx={{ bgcolor:'#DCFCE7', fontWeight:700, height:22 }} />
        <Chip size="small" label={`Best $${forecast.bestCase.toLocaleString()}`} sx={{ bgcolor:'#FEF3C2', fontWeight:700, height:22 }} />
        <Chip size="small" label={`Closed $${forecast.closed.toLocaleString()}`} color="success" sx={{ height:22, fontWeight:700 }} />
        <Box sx={{ ml:'auto', display:'flex', gap:1, alignItems:'center' }}>
          <Chip icon={<FiClock size={12}/>} label={`Avg cycle ${stats.opportunities.avgCycle}d`} size="small" variant="outlined" sx={{ height:20, fontSize:11 }}/>
          <Chip label={`Accounts ${stats.accounts.total} • Contacts ${stats.contacts.total} • Products ${stats.products.total}`} size="small" variant="outlined" sx={{ height:20, fontSize:10 }}/>
        </Box>
      </Paper>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9', height:340 }}>
            <Typography fontWeight={800} fontSize={13} sx={{ mb:1, display:'flex', alignItems:'center', gap:1 }}><FiTrendingUp size={14}/> Pipeline Funnel (count & weighted)</Typography>
            <Box sx={{ height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left:10, right:20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize:10 }} />
                  <YAxis dataKey="stage" type="category" width={90} tick={{ fontSize:11, fontWeight:600 }} />
                  <Tooltip formatter={(v,n)=> n==='weighted'? `$${Number(v).toLocaleString()}`: v} />
                  <Bar dataKey="count" fill="#14286D" radius={[0,8,8,0]} barSize={14} name="Count" />
                  <Bar dataKey="weighted" fill="#16A34A" radius={[0,8,8,0]} barSize={14} name="Weighted $" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9', height:340 }}>
            <Typography fontWeight={800} fontSize={13} sx={{ mb:1 }}>Leads by Source</Typography>
            <Box sx={{ height:260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={85} innerRadius={45} paddingAngle={2} label={({name, value, percent})=> `${name} ${(percent*100).toFixed(0)}%`}>
                    {sourceData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Stack direction="row" spacing={0.7} flexWrap="wrap" sx={{ mt:1 }}>
              {Object.entries(stats.leads.byStatus||{}).map(([k,v])=> <Chip key={k} label={`${k}:${v}`} size="small" sx={{ height:18, fontSize:10, bgcolor:'#F1F5F9' }}/>)}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
            <Typography fontWeight={800} fontSize={13} sx={{ mb:1 }}>Value by Stage (weighted)</Typography>
            <Box sx={{ height:260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageValue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize:10 }} interval={0} angle={-15} height={50} />
                  <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`$${v/1000}k`} />
                  <Tooltip formatter={v=>`$${Number(v).toLocaleString()}`} />
                  <Bar dataKey="weighted" fill="#7C3AED" radius={[6,6,0,0]} />
                  <Bar dataKey="value" fill="#E0E7FF" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2, borderRadius:3, border:'1px solid #E8EEF9' }}>
            <Typography fontWeight={800} fontSize={13} sx={{ mb:1, display:'flex', alignItems:'center', gap:0.7 }}><FiAlertCircle size={14} color="#DC2626"/> Health & Velocity</Typography>
            <Stack spacing={1.2}>
              <Box><Typography variant="caption" fontWeight={700}>Pipeline Health</Typography><LinearProgress variant="determinate" value={Math.min(100, (stats.opportunities.won/Math.max(1,stats.opportunities.total))*100 + 50)} sx={{ height:8, borderRadius:2, mt:0.5, bgcolor:'#E2E8F0', '& .MuiLinearProgress-bar':{ bgcolor: '#16A34A' } }}/><Typography variant="caption" color="text.secondary">{stats.leads.hot||0} hot leads • {stats.activities.overdue||0} overdue activities</Typography></Box>
              <Box sx={{ display:'flex', gap:1 }}>
                <Paper variant="outlined" sx={{ flex:1, p:1.2, borderRadius:2, textAlign:'center' }}><Typography fontWeight={800} color="#16A34A">{stats.opportunities.velocity||0}%</Typography><Typography variant="caption" color="text.secondary">Velocity</Typography></Paper>
                <Paper variant="outlined" sx={{ flex:1, p:1.2, borderRadius:2, textAlign:'center' }}><Typography fontWeight={800} color="#0284C7">{stats.opportunities.avgCycle}d</Typography><Typography variant="caption" color="text.secondary">Avg Cycle</Typography></Paper>
                <Paper variant="outlined" sx={{ flex:1, p:1.2, borderRadius:2, textAlign:'center' }}><Typography fontWeight={800} color="#7C3AED">${stats.opportunities.avgDeal.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Avg Deal</Typography></Paper>
              </Box>
              <Box sx={{ p:1.2, bgcolor:'#FFFBEB', borderRadius:2, border:'1px solid #FDE68A' }}>
                <Typography variant="caption" fontWeight={700} color="#92400E">AI Next Best Action</Typography>
                <Typography variant="caption" sx={{ display:'block', color:'#78350F' }}>{`Focus on Negotiation deals over $100k — 80% win probability • Call overdue leads within 2h`}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
