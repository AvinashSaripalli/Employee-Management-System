import { useState, useEffect, useCallback, useMemo } from 'react';
import * as svc from '../services/taskService';

export default function useTasks({ filter='all', myTasksOnly=false, search='', deps=[] }={}) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = useCallback(async ()=>{
    setLoading(true);
    try{
      const params={};
      if(filter!=='all') params.status=filter;
      if(myTasksOnly) params.myTasks='true';
      const data = await svc.fetchTasks(params);
      setTasks(data);
    }catch(e){ console.error(e); } finally{ setLoading(false); }
  },[filter, myTasksOnly]);

  const loadUsers = useCallback(async ()=>{
    try{ const data = await svc.fetchUsers(); setUsers(data);}catch(e){ console.error(e); }
  },[]);

  useEffect(()=>{ loadTasks(); },[loadTasks]);
  useEffect(()=>{ loadUsers(); },[loadUsers]);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    if(!q) return tasks;
    return tasks.filter(t=>
      t.title.toLowerCase().includes(q) ||
      (t.description||'').toLowerCase().includes(q) ||
      (t.responsible && `${t.responsible.firstName} ${t.responsible.lastName}`.toLowerCase().includes(q)) ||
      (t.responsibleId||'').toLowerCase().includes(q) ||
      String(t.id).includes(q)
    );
  },[tasks, search]);

  return { tasks, filtered, users, loading, reload: loadTasks, setTasks, setUsers };
}
