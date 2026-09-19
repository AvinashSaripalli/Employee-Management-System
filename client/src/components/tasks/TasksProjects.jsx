import React, { useState, useCallback } from 'react';
import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, Grid, Paper } from '@mui/material';
import { FiPlus } from 'react-icons/fi';
import { GridView as GridViewIcon, BarChart as BarChartIcon, ViewKanban as KanbanIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import useTasks from './hooks/useTasks';
import useTaskStats from './hooks/useTaskStats';
import TaskFilters from './components/TaskFilters';
import TaskTable from './components/TaskTable';
import TaskKanban from './components/TaskKanban';
import TaskTimeline from './components/TaskTimeline';
import TaskFormDialog from './components/TaskFormDialog';
import TaskDetailsDialog from './components/TaskDetailsDialog';
import TaskStatsBoard from './components/TaskStatsBoard';
import * as taskService from './services/taskService';

export default function TasksProjects(){
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);

  const { tasks, filtered, users, loading, reload } = useTasks({ filter, myTasksOnly, search, deps:[search] });
  const currentEmployeeId = localStorage.getItem('userEmployeeId')||'';
  const currentRole = localStorage.getItem('userRole')||'';

  // advanced filtering
  const displayed = filtered.filter(t=>{
    if(priorityFilter!=='all' && String(t.priority)!==String(priorityFilter)) return false;
    if(deadlineFrom && t.deadline && new Date(t.deadline) < new Date(deadlineFrom)) return false;
    if(deadlineTo && t.deadline && new Date(t.deadline) > new Date(deadlineTo)) return false;
    return true;
  });

  const stats = useTaskStats(tasks, users, currentEmployeeId);

  // form state
  const [openForm, setOpenForm]=useState(false);
  const [isEditMode, setIsEditMode]=useState(false);
  const [selectedTaskId, setSelectedTaskId]=useState(null);
  const [initialData, setInitialData]=useState(null);

  // view state
  const [viewTask, setViewTask]=useState(null);
  const [viewTab, setViewTab]=useState(0);
  const [activities, setActivities]=useState([]);
  const [loadingActivities, setLoadingActivities]=useState(false);
  const [teamAddType, setTeamAddType]=useState('A');
  const [teamAddUser, setTeamAddUser]=useState('');
  const [viewChecklistInput, setViewChecklistInput]=useState('');

  const canAct = useCallback((task)=>{
    const isAdmin = currentRole==='Admin'||currentRole==='Manager';
    return isAdmin || task.createdBy===currentEmployeeId || task.responsibleId===currentEmployeeId;
  },[currentRole, currentEmployeeId]);

  const handleOpenCreate = ()=>{
    setInitialData(null); setIsEditMode(false); setSelectedTaskId(null); setOpenForm(true);
  };
  const handleEdit = (task)=>{
    setIsEditMode(true); setSelectedTaskId(task.id);
    const members=task.members||[];
    setInitialData({
      title: task.title, description: task.description||'', responsibleId: task.responsibleId||'', priority: task.priority,
      deadline: task.deadline? task.deadline.split('T')[0]:'', parentId: task.parentId? String(task.parentId):'', taskControl: task.taskControl,
      checklist: task.checklist? task.checklist.map(c=>c.title):[], accomplishers: members.filter(m=>m.type==='A').map(m=>m.userId), observers: members.filter(m=>m.type==='U').map(m=>m.userId),
      tags: task.tags||[], attachments: [], estimatedHours: task.estimatedHours||''
    });
    setOpenForm(true);
  };
  const handleSubmit = async (payload)=>{
    try{
      if(isEditMode) await taskService.updateTask(selectedTaskId, payload);
      else await taskService.createTask(payload);
      setOpenForm(false); reload();
    }catch(e){ alert(e.response?.data?.error||'Error'); }
  };
  const handleDelete = async (task)=>{
    if(!window.confirm(`Delete "${task.title}"?`)) return;
    await taskService.deleteTask(task.id); reload();
  };
  const handleStatusAction = async (task, action)=>{
    try{
      const updated = await taskService.changeStatus(task.id, action);
      if(viewTask && viewTask.id===task.id){ setViewTask(updated); fetchActivities(task.id); }
      reload();
    }catch(e){ alert(e.response?.data?.error||'Error'); }
  };
  const handleKanbanStatus = async (task, newStatus)=>{
    if(task.status===newStatus) return;
    // map status to action? simple direct update via status change: use updateTask
    await taskService.updateTask(task.id, { status: newStatus });
    reload();
  };
  const fetchActivities = async (taskId)=>{
    setLoadingActivities(true);
    try{ const data= await taskService.fetchActivities(taskId); setActivities(data);}catch{} finally{ setLoadingActivities(false); }
  };
  const handleView = async (task)=>{
    const full = await taskService.getTask(task.id);
    setViewTask(full); setViewTab(0); fetchActivities(task.id);
  };
  const handleAddChecklist = async ()=>{
    if(!viewChecklistInput.trim()||!viewTask) return;
    const added = await taskService.addChecklist(viewTask.id, viewChecklistInput.trim());
    setViewTask(prev=> ({...prev, checklist:[...prev.checklist, added]}));
    setViewChecklistInput(''); fetchActivities(viewTask.id);
  };
  const handleToggleChecklist = async (item)=>{
    const upd = await taskService.toggleChecklist(item.id);
    setViewTask(prev=> ({...prev, checklist: prev.checklist.map(c=> c.id===item.id? upd:c)}));
    fetchActivities(viewTask.id);
  };
  const handleDeleteChecklist = async (item)=>{
    await taskService.deleteChecklist(item.id);
    setViewTask(prev=> ({...prev, checklist: prev.checklist.filter(c=> c.id!==item.id)}));
  };
  const handleAddMember = async ()=>{
    if(!viewTask||!teamAddUser) return;
    await taskService.addMember(viewTask.id, teamAddType, teamAddUser);
    setTeamAddUser(''); const fresh= await taskService.getTask(viewTask.id); setViewTask(fresh); reload();
  };
  const handleRemoveMember = async (member)=>{
    await taskService.removeMember(member.id);
    const fresh= await taskService.getTask(viewTask.id); setViewTask(fresh); reload();
  };
  const handleBulk = async (action)=>{
    if(action==='clear') setSelectedIds([]);
    else if(action==='delete'){ if(window.confirm(`Delete ${selectedIds.length} tasks?`)){ await taskService.bulkDelete(selectedIds); setSelectedIds([]); reload(); } }
    else if(action==='complete'){ await taskService.bulkStatus(selectedIds, 'complete'); setSelectedIds([]); reload(); }
  };
  const handleExport = ()=>{
    const rows=[['ID','Title','Assignee','Priority','Status','Deadline','Progress']];
    displayed.forEach(t=>{
      const p = t.checklist? `${t.checklist.filter(c=>c.isComplete).length}/${t.checklist.length}`:'0/0';
      rows.push([t.id, `"${t.title.replace(/"/g,'""')}"`, t.responsibleId, t.priority, t.status, t.deadline||'', p]);
    });
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`tasks_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p:{xs:2,md:3} }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2, flexWrap:'wrap', gap:1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Tasks & Projects</Typography>
          <Typography variant="caption" color="text.secondary">Plan, assign and track work — now with Board & Timeline</Typography>
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <ToggleButtonGroup size="small" exclusive value={viewMode} onChange={(_,v)=> v && setViewMode(v)} sx={{ bgcolor:'#EEF2FA', borderRadius:2, '& .Mui-selected':{ bgcolor:'#fff', color:'primary.main' } }}>
            <ToggleButton value="list"><GridViewIcon sx={{ fontSize:16, mr:0.5 }}/>List</ToggleButton>
            <ToggleButton value="kanban"><KanbanIcon sx={{ fontSize:16, mr:0.5 }}/>Board</ToggleButton>
            <ToggleButton value="timeline"><CalendarIcon sx={{ fontSize:16, mr:0.5 }}/>Timeline</ToggleButton>
            <ToggleButton value="stats"><BarChartIcon sx={{ fontSize:16, mr:0.5 }}/>Stats</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<FiPlus size={16}/>} onClick={handleOpenCreate} sx={{ borderRadius:2, textTransform:'none', fontWeight:700 }}>Add Task</Button>
        </Box>
      </Box>

      {viewMode!=='stats' && (
        <TaskFilters search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} myTasksOnly={myTasksOnly} setMyTasksOnly={setMyTasksOnly} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} deadlineFrom={deadlineFrom} setDeadlineFrom={setDeadlineFrom} deadlineTo={deadlineTo} setDeadlineTo={setDeadlineTo} selectedIds={selectedIds} onBulkAction={handleBulk} onExport={handleExport} tasksCount={displayed.length} />
      )}

      {viewMode==='list' && <TaskTable tasks={displayed} loading={loading} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />}
      {viewMode==='kanban' && <TaskKanban tasks={displayed} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleKanbanStatus} />}
      {viewMode==='timeline' && <TaskTimeline tasks={displayed} />}
      {viewMode==='stats' && <TaskStatsBoard stats={stats} onView={handleView} />}

      <TaskFormDialog open={openForm} onClose={()=>setOpenForm(false)} onSubmit={handleSubmit} users={users} tasks={tasks} initialData={initialData} isEditMode={isEditMode} />
      <TaskDetailsDialog open={Boolean(viewTask)} task={viewTask} activities={activities} loadingActivities={loadingActivities} users={users} canAct={canAct} onClose={()=>setViewTask(null)} onStatusAction={handleStatusAction} onAddChecklist={handleAddChecklist} onToggleChecklist={handleToggleChecklist} onDeleteChecklist={handleDeleteChecklist} onAddMember={handleAddMember} onRemoveMember={handleRemoveMember} viewChecklistInput={viewChecklistInput} setViewChecklistInput={setViewChecklistInput} teamAddType={teamAddType} setTeamAddType={setTeamAddType} teamAddUser={teamAddUser} setTeamAddUser={setTeamAddUser} viewTab={viewTab} setViewTab={setViewTab} />
    </Box>
  );
}
