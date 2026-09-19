import { useState, useEffect, useCallback } from 'react';
import * as svc from '../services/crmService';

export default function useCrm(){
  const [stats, setStats]=useState(null);
  const [leads, setLeads]=useState([]);
  const [accounts, setAccounts]=useState([]);
  const [contacts, setContacts]=useState([]);
  const [products, setProducts]=useState([]);
  const [quotes, setQuotes]=useState([]);
  const [opps, setOpps]=useState([]);
  const [activities, setActivities]=useState([]);
  const [loading, setLoading]=useState(false);

  const reload = useCallback(async ()=>{
    setLoading(true);
    try{
      const [s,l,a,c,p,q,o,act]=await Promise.all([
        svc.getStats().catch(()=>null), svc.listLeads(),
        svc.listAccounts().catch(()=>[]), svc.listContacts().catch(()=>[]),
        svc.listProducts().catch(()=>[]), svc.listQuotes().catch(()=>[]),
        svc.listOpps(), svc.listActivities().catch(()=>[])
      ]);
      if(s) setStats(s); setLeads(l||[]); setAccounts(a||[]); setContacts(c||[]); setProducts(p||[]); setQuotes(q||[]); setOpps(o||[]); setActivities(act||[]);
    }catch(e){ console.error(e); } finally{ setLoading(false); }
  },[]);

  useEffect(()=>{ reload(); },[reload]);
  return { stats, leads, accounts, contacts, products, quotes, opps, activities, loading, reload, setLeads, setOpps, setActivities };
}
