import React, { useState, useMemo } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Stack, TextField, InputAdornment, Chip, Grid, Card, CardContent, Divider } from '@mui/material';
import { FiGrid, FiUsers, FiBriefcase, FiActivity, FiTrendingUp, FiSearch, FiCommand, FiTarget, FiDollarSign, FiAward } from 'react-icons/fi';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import useCrm from './hooks/useCrm';
import CrmDashboard from './components/CrmDashboard';
import LeadsBoard from './components/LeadsBoard';
import AccountsBoard from './components/AccountsBoard';
import ContactsBoard from './components/ContactsBoard';
import ProductsBoard from './components/ProductsBoard';
import QuotesBoard from './components/QuotesBoard';
import PipelineKanban from './components/PipelineKanban';
import ActivitiesBoard from './components/ActivitiesBoard';
import { LeadDialog, AccountDialog, OpportunityDialog, ActivityDialog, ContactDialog, ProductDialog, QuoteDialog } from './components/CrmDialogs';
import * as svc from './services/crmService';

export default function Crm(){
  const { stats, leads, accounts, contacts, products, quotes, opps, activities, reload } = useCrm();
  const [tab,setTab]=useState(0);
  const [globalQ,setGlobalQ]=useState('');
  const [leadDlg,setLeadDlg]=useState({open:false, initial:null});
  const [accDlg,setAccDlg]=useState({open:false, initial:null});
  const [contactDlg,setContactDlg]=useState({open:false, initial:null});
  const [oppDlg,setOppDlg]=useState({open:false, initial:null});
  const [productDlg,setProductDlg]=useState({open:false, initial:null});
  const [quoteDlg,setQuoteDlg]=useState({open:false, initial:null});
  const [actDlg,setActDlg]=useState({open:false, initial:null});

  const handleLeadSave = async (data)=>{ if(leadDlg.initial) await svc.updateLead(leadDlg.initial.id, data); else await svc.createLead(data); setLeadDlg({open:false, initial:null}); reload(); };
  const handleAccSave = async (data)=>{ if(accDlg.initial) await svc.updateAccount(accDlg.initial.id, data); else await svc.createAccount(data); setAccDlg({open:false, initial:null}); reload(); };
  const handleContactSave = async (data)=>{ if(contactDlg.initial) await svc.updateContact(contactDlg.initial.id, data); else await svc.createContact(data); setContactDlg({open:false, initial:null}); reload(); };
  const handleProductSave = async (data)=>{ if(productDlg.initial) await svc.updateProduct(productDlg.initial.id, data); else await svc.createProduct(data); setProductDlg({open:false, initial:null}); reload(); };
  const handleQuoteSave = async (data)=>{ if(quoteDlg.initial) await svc.updateQuote(quoteDlg.initial.id, data); else await svc.createQuote(data); setQuoteDlg({open:false, initial:null}); reload(); };
  const handleOppSave = async (data)=>{ if(oppDlg.initial) await svc.updateOpp(oppDlg.initial.id, data); else await svc.createOpp(data); setOppDlg({open:false, initial:null}); reload(); };
  const handleActSave = async (data)=>{ if(actDlg.initial) await svc.updateActivity(actDlg.initial.id, data); else await svc.createActivity(data); setActDlg({open:false, initial:null}); reload(); };

  const quickStats = useMemo(()=> stats? [
    { label:'Pipeline', value: `$${Number(stats.opportunities.weighted||0).toLocaleString()}`, sub:'Weighted', color:'#14286D' },
    { label:'Win Rate', value: `${stats.opportunities.total? Math.round(stats.opportunities.won/stats.opportunities.total*100):0}%`, sub:`${stats.opportunities.won} won`, color:'#16A34A' },
    { label:'Hot Leads', value: stats.leads.hot||0, sub:`${stats.leads.total} total`, color:'#F59E0B' },
    { label:'Overdue', value: stats.activities.overdue||0, sub:'activities', color:'#EF4444' },
  ]: [],[stats]);

  return (
    <Box sx={{ p:{xs:1.5, md:2.5}, bgcolor:'#F8FAFD', minHeight:'calc(100vh - 68px)' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p:1.8, mb:1.5, borderRadius:3, border:'1px solid #E8ECF5', background:'linear-gradient(135deg,#FFFFFF 0%, #F8FAFD 100%)' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:2, flexWrap:'wrap' }}>
          <Box sx={{ width:42, height:42, borderRadius:2, bgcolor:'#14286D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><HiOutlineBuildingOffice2 size={22}/></Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#14286D" sx={{ lineHeight:1.1 }}>CRM • KN Advisors</Typography>
            <Typography variant="caption" color="text.secondary">Enterprise • AI scoring • Forecast • 360° • Automation</Typography>
          </Box>
          <Box sx={{ flex:1, maxWidth:380, ml:{ md:2 } }}>
            <TextField size="small" fullWidth placeholder="Search leads, accounts, deals... ( / )" value={globalQ} onChange={e=>setGlobalQ(e.target.value)} InputProps={{ startAdornment:<InputAdornment position="start"><FiSearch size={14}/></InputAdornment>, endAdornment:<InputAdornment position="end"><Chip size="small" icon={<FiCommand size={10}/>} label="K" sx={{ height:18, fontSize:10 }}/></InputAdornment> }} sx={{ bgcolor:'#fff', borderRadius:2, '& .MuiOutlinedInput-root':{ borderRadius:2 } }} />
          </Box>
          <Stack direction="row" spacing={1} sx={{ ml:'auto', flexWrap:'wrap' }}>
            {quickStats.map(s=> <Paper key={s.label} elevation={0} sx={{ px:1.4, py:0.7, borderRadius:2, border:'1px solid #E8EEF9', bgcolor:'#fff', textAlign:'center', minWidth:84 }}><Typography variant="caption" fontWeight={700} color={s.color}>{s.value}</Typography><Typography variant="caption" sx={{ display:'block', fontSize:9, color:'text.secondary' }}>{s.label} • {s.sub}</Typography></Paper>)}
          </Stack>
        </Box>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mt:1.5, '& .MuiTab-root':{ textTransform:'none', fontWeight:700, minHeight:34, fontSize:12 }, '& .MuiTabs-indicator':{ height:3, borderRadius:1 }}}>
          <Tab icon={<FiGrid size={14}/>} iconPosition="start" label="Dashboard" />
          <Tab icon={<FiUsers size={14}/>} iconPosition="start" label={`Leads ${leads.length?`(${leads.length})`:''}`} />
          <Tab icon={<FiBriefcase size={14}/>} iconPosition="start" label={`Accounts ${accounts.length?`(${accounts.length})`:''}`} />
          <Tab icon={<FiUsers size={14}/>} iconPosition="start" label={`Contacts ${contacts.length?`(${contacts.length})`:''}`} />
          <Tab icon={<FiTrendingUp size={14}/>} iconPosition="start" label={`Pipeline ${opps.length?`(${opps.length})`:''}`} />
          <Tab icon={<FiGrid size={14}/>} iconPosition="start" label={`Products ${products.length?`(${products.length})`:''}`} />
          <Tab icon={<FiDollarSign size={14}/>} iconPosition="start" label={`Quotes ${quotes.length?`(${quotes.length})`:''}`} />
          <Tab icon={<FiActivity size={14}/>} iconPosition="start" label={`Activities ${activities.length?`(${activities.length})`:''}`} />
        </Tabs>
      </Paper>

      {/* Content */}
      {tab===0 && <CrmDashboard stats={stats} />}
      {tab===1 && <LeadsBoard leads={leads} onCreate={()=>setLeadDlg({open:true, initial:null})} onEdit={(l)=>setLeadDlg({open:true, initial:l})} onDelete={async(l)=>{ if(window.confirm('Delete lead?')){ await svc.deleteLead(l.id); reload(); }}} onConvert={async(l)=>{ await svc.convertLead(l.id); reload(); }} />}
      {tab===2 && <AccountsBoard accounts={accounts} onCreate={()=>setAccDlg({open:true, initial:null})} onEdit={(a)=>setAccDlg({open:true, initial:a})} onDelete={async(a)=>{ if(window.confirm('Delete?')){ await svc.deleteAccount(a.id); reload(); }}} />}
      {tab===3 && <ContactsBoard contacts={contacts} accounts={accounts} onCreate={()=>setContactDlg({open:true, initial:null})} onEdit={(c)=>setContactDlg({open:true, initial:c})} onDelete={async(c)=>{ if(window.confirm('Delete contact?')){ await svc.deleteContact(c.id); reload(); }}} />}
      {tab===4 && <PipelineKanban opps={opps} onEdit={(o)=>setOppDlg({open:true, initial:o})} onDelete={async(o)=>{ if(window.confirm('Delete opportunity?')){ await svc.deleteOpp(o.id); reload(); }}} onView={()=>{}} onStageChange={async(o, stage)=>{ await svc.updateOpp(o.id, { stage, probability: ({Lead:20, Qualified:40, Proposal:60, Negotiation:80, 'Closed Won':100, 'Closed Lost':0}[stage]||20)}); reload(); }} />}
      {tab===5 && <ProductsBoard products={products} onCreate={()=>setProductDlg({open:true, initial:null})} onEdit={(p)=>setProductDlg({open:true, initial:p})} onDelete={async(p)=>{ if(window.confirm('Delete product?')){ await svc.deleteProduct(p.id); reload(); }}} />}
      {tab===6 && <QuotesBoard quotes={quotes} accounts={accounts} opps={opps} onCreate={()=>setQuoteDlg({open:true, initial:null})} onEdit={(q)=>setQuoteDlg({open:true, initial:q})} onDelete={async(q)=>{ if(window.confirm('Delete quote?')){ await svc.deleteQuote(q.id); reload(); }}} />}
      {tab===7 && <ActivitiesBoard activities={activities} onCreate={()=>setActDlg({open:true, initial:null})} onEdit={(a)=>setActDlg({open:true, initial:a})} onDelete={async(a)=>{ await svc.deleteActivity(a.id); reload(); }} onToggle={async(a)=>{ await svc.updateActivity(a.id,{ done: !a.done }); reload(); }} />}

      {/* Advanced foot: AI insight */}
      <Paper elevation={0} sx={{ mt:2, p:1.5, borderRadius:3, border:'1px dashed #CBD5E1', bgcolor:'#FFFBEB', display:'flex', gap:1, alignItems:'center', flexWrap:'wrap' }}>
        <FiAward size={16} color="#D97706"/><Typography variant="caption" fontWeight={700} color="#92400E">AI Insight:</Typography>
        <Typography variant="caption" color="#78350F">
          {leads.length? `Next best action: Follow up with ${leads[0]?.firstName||'top'} ${leads[0]?.lastName||'lead'} (${leads[0]?.health||'Warm'}) — ` : ''} 
          {stats? `Forecast $${Number(stats.opportunities?.forecast?.pipeline||0).toLocaleString()} weighted • Velocity ${stats.opportunities?.velocity||0}% • Hot leads ${stats.leads?.hot||0}` : 'Loading...'}
        </Typography>
        <Chip size="small" label="AI Scoring" color="warning" sx={{ ml:'auto', height:20, fontSize:10 }}/>
      </Paper>

      {/* Dialogs */}
      <LeadDialog open={leadDlg.open} onClose={()=>setLeadDlg({open:false, initial:null})} onSave={handleLeadSave} initial={leadDlg.initial} />
      <AccountDialog open={accDlg.open} onClose={()=>setAccDlg({open:false, initial:null})} onSave={handleAccSave} initial={accDlg.initial} />
      <ContactDialog open={contactDlg.open} onClose={()=>setContactDlg({open:false, initial:null})} onSave={handleContactSave} initial={contactDlg.initial} accounts={accounts} />
      <OpportunityDialog open={oppDlg.open} onClose={()=>setOppDlg({open:false, initial:null})} onSave={handleOppSave} initial={oppDlg.initial} accounts={accounts} />
      <ProductDialog open={productDlg.open} onClose={()=>setProductDlg({open:false, initial:null})} onSave={handleProductSave} initial={productDlg.initial} />
      <QuoteDialog open={quoteDlg.open} onClose={()=>setQuoteDlg({open:false, initial:null})} onSave={handleQuoteSave} initial={quoteDlg.initial} accounts={accounts} opps={opps} />
      <ActivityDialog open={actDlg.open} onClose={()=>setActDlg({open:false, initial:null})} onSave={handleActSave} initial={actDlg.initial} />
    </Box>
  );
}
