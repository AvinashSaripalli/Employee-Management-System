import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Stack } from '@mui/material';
import { FiGrid, FiUsers, FiBriefcase, FiActivity, FiTrendingUp } from 'react-icons/fi';
import useCrm from './hooks/useCrm';
import CrmDashboard from './components/CrmDashboard';
import LeadsBoard from './components/LeadsBoard';
import AccountsBoard from './components/AccountsBoard';
import PipelineKanban from './components/PipelineKanban';
import ActivitiesBoard from './components/ActivitiesBoard';
import { LeadDialog, AccountDialog, OpportunityDialog, ActivityDialog } from './components/CrmDialogs';
import * as svc from './services/crmService';

export default function Crm(){
  const { stats, leads, accounts, opps, activities, reload } = useCrm();
  const [tab,setTab]=useState(0);
  const [leadDlg,setLeadDlg]=useState({open:false, initial:null});
  const [accDlg,setAccDlg]=useState({open:false, initial:null});
  const [oppDlg,setOppDlg]=useState({open:false, initial:null});
  const [actDlg,setActDlg]=useState({open:false, initial:null});

  const handleLeadSave = async (data)=>{
    if(leadDlg.initial) await svc.updateLead(leadDlg.initial.id, data);
    else await svc.createLead(data);
    setLeadDlg({open:false, initial:null}); reload();
  };
  const handleAccSave = async (data)=>{
    if(accDlg.initial) await svc.updateAccount(accDlg.initial.id, data);
    else await svc.createAccount(data);
    setAccDlg({open:false, initial:null}); reload();
  };
  const handleOppSave = async (data)=>{
    if(oppDlg.initial) await svc.updateOpp(oppDlg.initial.id, data);
    else await svc.createOpp(data);
    setOppDlg({open:false, initial:null}); reload();
  };
  const handleActSave = async (data)=>{
    if(actDlg.initial) await svc.updateActivity(actDlg.initial.id, data);
    else await svc.createActivity(data);
    setActDlg({open:false, initial:null}); reload();
  };

  return (
    <Box sx={{ p:{xs:2, md:3}, bgcolor:'#F8FAFD', minHeight:'calc(100vh - 68px)' }}>
      <Paper elevation={0} sx={{ p:2, mb:2, borderRadius:3, border:'1px solid #E8ECF5', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#14286D">CRM</Typography>
          <Typography variant="caption" color="text.secondary">Advanced customer relationship — leads • accounts • pipeline • activities</Typography>
        </Box>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" sx={{ '& .MuiTab-root':{ textTransform:'none', fontWeight:600, minHeight:36 }}}>
          <Tab icon={<FiGrid size={14}/>} iconPosition="start" label="Dashboard" />
          <Tab icon={<FiUsers size={14}/>} iconPosition="start" label={`Leads (${leads.length})`} />
          <Tab icon={<FiBriefcase size={14}/>} iconPosition="start" label={`Accounts (${accounts.length})`} />
          <Tab icon={<FiTrendingUp size={14}/>} iconPosition="start" label={`Pipeline (${opps.length})`} />
          <Tab icon={<FiActivity size={14}/>} iconPosition="start" label={`Activities (${activities.length})`} />
        </Tabs>
      </Paper>

      {tab===0 && <CrmDashboard stats={stats} />}
      {tab===1 && <LeadsBoard leads={leads} onCreate={()=>setLeadDlg({open:true, initial:null})} onEdit={(l)=>setLeadDlg({open:true, initial:l})} onDelete={async(l)=>{ if(window.confirm('Delete lead?')){ await svc.deleteLead(l.id); reload(); }}} onConvert={async(l)=>{ await svc.convertLead(l.id); reload(); }} />}
      {tab===2 && <AccountsBoard accounts={accounts} onCreate={()=>setAccDlg({open:true, initial:null})} onEdit={(a)=>setAccDlg({open:true, initial:a})} onDelete={async(a)=>{ if(window.confirm('Delete?')){ await svc.deleteAccount(a.id); reload(); }}} />}
      {tab===3 && <PipelineKanban opps={opps} onEdit={(o)=>setOppDlg({open:true, initial:o})} onDelete={async(o)=>{ if(window.confirm('Delete opportunity?')){ await svc.deleteOpp(o.id); reload(); }}} onView={()=>{}} onStageChange={async(o, stage)=>{ await svc.updateOpp(o.id, { stage, probability: ({Lead:20, Qualified:40, Proposal:60, Negotiation:80, 'Closed Won':100, 'Closed Lost':0}[stage]||20)}); reload(); }} />}
      {tab===4 && <ActivitiesBoard activities={activities} onCreate={()=>setActDlg({open:true, initial:null})} onEdit={(a)=>setActDlg({open:true, initial:a})} onDelete={async(a)=>{ await svc.deleteActivity(a.id); reload(); }} onToggle={async(a)=>{ await svc.updateActivity(a.id,{ done: !a.done }); reload(); }} />}

      <LeadDialog open={leadDlg.open} onClose={()=>setLeadDlg({open:false, initial:null})} onSave={handleLeadSave} initial={leadDlg.initial} />
      <AccountDialog open={accDlg.open} onClose={()=>setAccDlg({open:false, initial:null})} onSave={handleAccSave} initial={accDlg.initial} />
      <OpportunityDialog open={oppDlg.open} onClose={()=>setOppDlg({open:false, initial:null})} onSave={handleOppSave} initial={oppDlg.initial} accounts={accounts} />
      <ActivityDialog open={actDlg.open} onClose={()=>setActDlg({open:false, initial:null})} onSave={handleActSave} initial={actDlg.initial} />
    </Box>
  );
}
