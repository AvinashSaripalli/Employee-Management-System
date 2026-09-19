import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, TextField, IconButton, InputAdornment,
  Button, Tabs, Tab, Divider, Chip, Stack, Tooltip, Menu, MenuItem, Badge, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Drawer, Popover, LinearProgress, Fade
} from '@mui/material';
import {
  FiSend, FiPaperclip, FiSmile, FiSearch, FiMoreVertical, FiPhone, FiVideo, FiImage, FiFileText, FiTrash2, FiEdit2, FiCornerUpLeft, FiX, FiUsers, FiMessageCircle, FiGrid,
  FiCheck, FiCheckCircle, FiMic, FiStopCircle, FiBookmark, FiStar, FiCopy, FiCornerUpRight, FiArchive, FiBell, FiMapPin, FiEye, FiInfo, FiPlay, FiPause, FiVolume2
} from 'react-icons/fi';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import axios from '../../api/axios';
import { io as socketIO } from 'socket.io-client';

// ---------- constants ----------
const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🙏','🔥','🎉','👏','😊','🤝','⚡'];
const EMOJI_PICKER = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠'];
const QUICK_REPLIES = ['Got it 👍','On it!','Thanks!','Will do','Need more info','Let’s discuss','Approved ✅','Will review shortly'];

const dmKey = (a,b) => `dm:${[a,b].sort().join('_')}`;
const companyRoom = (company) => `company:${company}`;
const groupKey = (company, partner) => `group:${company}:${partner}`;

const formatTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  const now = new Date();
  const diff = Math.floor((now - d)/60000);
  if (diff < 1) return 'now';
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  return d.toLocaleDateString();
};
const formatLastSeen = (v) => {
  if(!v) return 'Offline';
  const d = new Date(v);
  const mins = Math.floor((Date.now()-d)/60000);
  if(mins<5) return 'Online';
  if(mins<60) return `Last seen ${mins}m ago`;
  if(mins<1440) return `Last seen today at ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
  return `Last seen ${d.toLocaleDateString()}`;
};
const dayLabel = (v) => {
  const d = new Date(v);
  const today = new Date(); today.setHours(0,0,0,0);
  const yest = new Date(today); yest.setDate(today.getDate()-1);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  if (dd.getTime()===today.getTime()) return 'Today';
  if (dd.getTime()===yest.getTime()) return 'Yesterday';
  return d.toLocaleDateString(undefined,{month:'short', day:'numeric', year: d.getFullYear()!==today.getFullYear()?'numeric':undefined});
};
const highlight = (text, query) => {
  if(!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if(idx===-1) return text;
  return <>{text.slice(0,idx)}<Box component="span" sx={{ bgcolor:'#FEF08A', px:0.4, borderRadius:0.5 }}>{text.slice(idx, idx+query.length)}</Box>{text.slice(idx+query.length)}</>;
};

export default function Messenger() {
  const meId = localStorage.getItem('userEmployeeId') || localStorage.getItem('userId') || 'me';
  const meName = `${localStorage.getItem('userFirstName')||''} ${localStorage.getItem('userLastName')||''}`.trim() || 'You';
  const company = localStorage.getItem('companyName') || '';
  const token = localStorage.getItem('token') || '';
  // core
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [workgroups, setWorkgroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [online, setOnline] = useState([]);
  const [msgSearch, setMsgSearch] = useState('');
  const [anchorMsg, setAnchorMsg] = useState(null);
  const [activeMsg, setActiveMsg] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // {file, url, type}
  const [uploadProgress, setUploadProgress] = useState(0);
  const [threadMsg, setThreadMsg] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [muted, setMuted] = useState(()=> JSON.parse(localStorage.getItem('mutedConvs')||'[]'));
  const [archived, setArchived] = useState(()=> JSON.parse(localStorage.getItem('archivedConvs')||'[]'));
  const [starred, setStarred] = useState(()=> JSON.parse(localStorage.getItem('starredMsgs')||'[]'));
  const [showArchived, setShowArchived] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null); // {query, anchor}
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef(null);
  const listRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);
  const recorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const inputRef = useRef(null);

  // fetch directory & workgroups & conversations
  useEffect(()=>{
    const fetchAll = async ()=>{
      try{
        const [dirRes, wgRes] = await Promise.all([
          axios.get('/messages/directory',{params:{companyName:company}}),
          axios.get('/workgroups',{params:{companyName:company}}).catch(()=>({data:[]})),
        ]);
        setDirectory(dirRes.data||[]);
        const grouped = {};
        (wgRes.data||[]).forEach(w=>{ if(!grouped[w.partnerCompanyName]) grouped[w.partnerCompanyName]=w; });
        setWorkgroups(Object.values(grouped).map(g=>({partnerCompanyName:g.partnerCompanyName, ...g})));
        const convRes = await axios.get('/messages/conversations',{params:{companyName:company, employeeId:meId}});
        setConversations(convRes.data||[]);
      }catch(e){ console.error(e); }
    };
    if(company) fetchAll();
  },[company, meId]);

  // pinned sync per conversation
  useEffect(()=>{
    if(!selected) return;
    const key = `pinned:${selected.conversationId}`;
    setPinned(JSON.parse(localStorage.getItem(key)||'[]'));
  },[selected?.conversationId]);
  const togglePin = (msgId)=>{
    const key = `pinned:${selected.conversationId}`;
    const next = pinned.includes(msgId) ? pinned.filter(id=>id!==msgId) : [...pinned, msgId];
    setPinned(next); localStorage.setItem(key, JSON.stringify(next));
  };

  // socket
  useEffect(()=>{
    if(!company) return;
    const socket = socketIO(window.location.origin, { auth:{ token }, query:{ token } });
    socketRef.current = socket;
    socket.emit('join:conversation', companyRoom(company));
    const playSound = ()=>{
      try{ const a=new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='); a.volume=0.25; a.play().catch(()=>{});}catch{}
    };
    const notify = (msg)=>{
      if(muted.includes(msg.conversationId)) return;
      playSound();
      if(Notification && Notification.permission==='granted' && document.hidden){
        new Notification(msg.senderName, { body: msg.content.slice(0,120), icon: msg.senderPhoto||undefined });
      }
    };
    if(Notification && Notification.permission==='default') Notification.requestPermission().catch(()=>{});
    socket.on('message:new', (msg)=>{
      if(msg.companyName!==company) return;
      const isSelf = msg.senderEmployeeId===meId;
      if(!isSelf) notify(msg);
      if(selected && msg.conversationId===selected.conversationId){
        setMessages(prev=> prev.find(m=>m.id===msg.id)? prev: [...prev, msg]);
      }
      setConversations(prev=>{
        const idx = prev.findIndex(c=>c.conversationId===msg.conversationId);
        const entry = { conversationId: msg.conversationId, lastMessage:{content: msg.content, senderName: msg.senderName, created_at: msg.created_at, messageType: msg.messageType}, count: (idx>=0?prev[idx].count:0)+1, unread: (isSelf|| selected?.conversationId===msg.conversationId?0:1) };
        if(idx>=0){ const copy=[...prev]; copy.splice(idx,1); return [entry, ...copy]; }
        return [entry, ...prev];
      });
    });
    socket.on('message:update', (msg)=>{
      setMessages(prev=> prev.map(m=> m.id===msg.id? {...m, ...msg, reactions: typeof msg.reactions==='string'? JSON.parse(msg.reactions||'{}'): msg.reactions }: m));
    });
    socket.on('typing:start', ({conversationId, senderName})=> setTypingUsers(p=>({...p, [conversationId]: senderName})));
    socket.on('typing:stop', ({conversationId})=> setTypingUsers(p=>{ const c={...p}; delete c[conversationId]; return c; }));
    socket.on('presence:update', ({online: list})=> setOnline(list||[]));
    return ()=> socket.disconnect();
  },[company, token, meId, muted, selected]);

  useEffect(()=>{
    if(selected?.conversationId && socketRef.current){
      socketRef.current.emit('join:conversation', selected.conversationId);
      return ()=> socketRef.current?.emit('leave:conversation', selected.conversationId);
    }
  },[selected]);

  const loadMessages = useCallback(async (convId, opts={append:false})=>{
    if(!convId) return;
    const offset = opts.append? messages.length: 0;
    if(!opts.append) setLoadingMsgs(true);
    try{
      const res = await axios.get('/messages',{params:{companyName:company, conversationId: convId, limit:50, offset}});
      const data = res.data||[];
      setHasMore(data.length===50);
      if(opts.append){
        if(data.length) setMessages(prev=> [...data, ...prev]);
      } else setMessages(data);
    }catch(e){ console.error(e); }
    finally{ setLoadingMsgs(false); }
  },[company, messages.length]);
  useEffect(()=>{ if(selected){ setHasMore(true); loadMessages(selected.conversationId); } },[selected?.conversationId]);

  useEffect(()=>{
    if(!loadingMsgs && listRef.current && messages.length && !msgSearch) listRef.current.scrollTop = listRef.current.scrollHeight;
  },[messages, msgSearch, loadingMsgs]);

  const onScroll = ()=>{
    const el = listRef.current;
    if(!el || loadingMsgs || !hasMore) return;
    if(el.scrollTop < 80){
      const prevH = el.scrollHeight;
      loadMessages(selected.conversationId, {append:true}).then(()=>{
        requestAnimationFrame(()=>{ el.scrollTop = el.scrollHeight - prevH + el.scrollTop; });
      });
    }
  };

  // helpers
  const handleSelectUser = (user)=>{
    const cid = dmKey(meId, user.employeeId);
    setSelected({ conversationId: cid, name:`${user.firstName} ${user.lastName}`, photo: user.photo, subtitle: user.designation||user.department||user.email, type:'dm', user });
    setReplyTo(null); setEditing(null); setThreadMsg(null);
  };
  const handleSelectGroup = (wg)=>{
    const cid = groupKey(company, wg.partnerCompanyName);
    setSelected({ conversationId: cid, name: wg.partnerCompanyName, photo: null, subtitle: `${wg.privacyType||'Private'} • ${wg.partnerCompanyName}`, type:'group', wg });
  };
  const handleSelectCompany = ()=>{
    const cid = companyRoom(company);
    setSelected({ conversationId: cid, name: company || 'Company', photo:null, subtitle:'Company-wide channel', type:'company'});
  };
  const handleSelectConversation = (c)=>{
    let meta = { name: c.conversationId, photo:null, subtitle:'' };
    if(c.conversationId.startsWith('dm:')){
      const ids = c.conversationId.replace('dm:','').split('_');
      const other = ids.find(x=>x!==meId) || ids[0];
      const u = directory.find(d=>d.employeeId===other);
      if(u) meta = { name:`${u.firstName} ${u.lastName}`, photo:u.photo, subtitle: u.designation||u.department };
      else meta = { name: other, photo:null, subtitle:'Direct message' };
    } else if(c.conversationId.startsWith('group:')){
      const partner = c.conversationId.split(':').slice(2).join(':');
      meta = { name: partner, photo:null, subtitle:'Workgroup' };
    } else if(c.conversationId.startsWith('company:')){
      meta = { name: company, photo:null, subtitle:'Company channel' };
    }
    setSelected({ conversationId: c.conversationId, ...meta, type: c.conversationId.startsWith('dm:')?'dm':c.conversationId.startsWith('group:')?'group':'company'});
    setConversations(prev=> prev.map(p=> p.conversationId===c.conversationId? {...p, unread:0}: p));
  };

  const emitTyping = (start)=>{
    if(!selected) return;
    socketRef.current?.emit(start?'typing:start':'typing:stop', { conversationId: selected.conversationId, senderName: meName });
  };
  const onInputChange = (v)=>{
    setInput(v);
    // mention detection
    const cursor = inputRef.current?.selectionStart ?? v.length;
    const before = v.slice(0, cursor);
    const at = before.lastIndexOf('@');
    if(at>=0){
      const q = before.slice(at+1);
      if(!q.includes(' ') && q.length<20){
        setMentionQuery({ query:q, at });
      } else setMentionQuery(null);
    } else setMentionQuery(null);
    emitTyping(!!v);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(()=> emitTyping(false), 1200);
  };
  const insertMention = (user)=>{
    if(mentionQuery==null) return;
    const before = input.slice(0, mentionQuery.at);
    const after = input.slice(inputRef.current?.selectionStart ?? input.length);
    const mention = `@${user.firstName}${user.lastName} `;
    const next = before + mention + after;
    setInput(next); setMentionQuery(null);
    setTimeout(()=> inputRef.current?.focus(),0);
  };

  const send = async ()=>{
    if(!selected || (!input.trim() && !editing && !previewFile)) return;
    const content = input.trim();
    if(editing){
      await axios.patch(`/messages/${editing.id}`, { content });
      setEditing(null); setInput(''); emitTyping(false); return;
    }
    try{
      if(previewFile){
        const fd = new FormData();
        fd.append('conversationId', selected.conversationId);
        fd.append('companyName', company);
        fd.append('content', content || previewFile.file.name);
        fd.append('file', previewFile.file);
        if(replyTo) fd.append('replyToId', replyTo.id);
        await axios.post('/messages', fd, { headers:{ 'Content-Type':'multipart/form-data' }, onUploadProgress:(e)=> setUploadProgress(Math.round((e.loaded*100)/(e.total||1))) });
        setPreviewFile(null); setUploadProgress(0);
      } else {
        const fd = new FormData();
        fd.append('conversationId', selected.conversationId);
        fd.append('companyName', company);
        fd.append('content', content);
        if(replyTo) fd.append('replyToId', replyTo.id);
        await axios.post('/messages', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      }
      setInput(''); setReplyTo(null); emitTyping(false);
    }catch(e){ console.error(e); alert(e.response?.data?.error||'Failed to send'); }
  };
  const sendFile = async (file)=>{
    if(!file || !selected) return;
    setPreviewFile({ file, url: file.type.startsWith('image/')? URL.createObjectURL(file): null, type: file.type });
  };
  const confirmSendFile = async ()=>{
    if(!previewFile) return;
    await send();
  };

  const handleReaction = async (msg, emoji)=>{ try{ await axios.post(`/messages/${msg.id}/reaction`, { emoji }); }catch{} };
  const handleDelete = async (msg)=>{ if(!window.confirm('Delete message?')) return; try{ await axios.delete(`/messages/${msg.id}`); }catch{} };
  const handleEdit = (msg)=>{ setEditing(msg); setInput(msg.content); setReplyTo(null); };
  const handleCopy = (t)=> navigator.clipboard.writeText(t);
  const handleForward = async (targetCid)=>{
    if(!forwardMsg) return;
    const fd = new FormData(); fd.append('conversationId', targetCid); fd.append('companyName', company); fd.append('content', forwardMsg.content);
    if(forwardMsg.fileUrl) {
      // for simplicity, forward as text with file link
      fd.set('content', `[Forwarded] ${forwardMsg.content}`);
    }
    await axios.post('/messages', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
    setForwardMsg(null);
  };
  const toggleMute = (cid)=>{
    const next = muted.includes(cid)? muted.filter(x=>x!==cid): [...muted, cid];
    setMuted(next); localStorage.setItem('mutedConvs', JSON.stringify(next));
  };
  const toggleArchive = (cid)=>{
    const next = archived.includes(cid)? archived.filter(x=>x!==cid): [...archived, cid];
    setArchived(next); localStorage.setItem('archivedConvs', JSON.stringify(next));
  };
  const toggleStar = (msgId)=>{
    const next = starred.includes(msgId)? starred.filter(x=>x!==msgId): [...starred, msgId];
    setStarred(next); localStorage.setItem('starredMsgs', JSON.stringify(next));
  };

  // drag & drop + paste
  const onDrop = (e)=>{ e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files?.[0]; if(f) sendFile(f); };
  const onPaste = (e)=>{
    const items = e.clipboardData?.items;
    if(!items) return;
    for(const it of items){ if(it.kind==='file'){ const f=it.getAsFile(); if(f) sendFile(f); } }
  };

  // voice
  const startRecording = async ()=>{
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const rec = new MediaRecorder(stream);
      const chunks=[];
      rec.ondataavailable=e=> chunks.push(e.data);
      rec.onstop= async ()=>{
        const blob = new Blob(chunks, { type:'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type:'audio/webm' });
        await sendFile(file); // will preview, then we auto confirm
        setTimeout(()=> confirmSendFile(), 100);
        stream.getTracks().forEach(t=>t.stop());
      };
      recorderRef.current = rec; rec.start(); setIsRecording(true); setRecordSecs(0);
      recordTimerRef.current = setInterval(()=> setRecordSecs(s=>s+1),1000);
    }catch{ alert('Microphone permission needed'); }
  };
  const stopRecording = ()=>{
    recorderRef.current?.stop(); setIsRecording(false); clearInterval(recordTimerRef.current);
  };

  const filteredDirectory = useMemo(()=> directory.filter(d=> `${d.firstName} ${d.lastName} ${d.email} ${d.department} ${d.employeeId}`.toLowerCase().includes(search.toLowerCase())),[directory, search]);
  const filteredConvs = useMemo(()=>{
    let list = conversations.filter(c=> !archived.includes(c.conversationId) || showArchived);
    if(search) list = list.filter(c=> c.conversationId.toLowerCase().includes(search.toLowerCase()) || (c.lastMessage?.content||'').toLowerCase().includes(search.toLowerCase()));
    // pinned on top
    const pinnedSet = new Set(JSON.parse(localStorage.getItem('pinnedConvs')||'[]'));
    return [...list].sort((a,b)=>{
      const ap = pinnedSet.has(a.conversationId)?0:1;
      const bp = pinnedSet.has(b.conversationId)?0:1;
      if(ap!==bp) return ap-bp;
      return new Date(b.lastMessage?.created_at||0)-new Date(a.lastMessage?.created_at||0);
    });
  },[conversations, search, archived, showArchived]);
  const filteredMsgs = useMemo(()=>{
    if(!msgSearch.trim()) return messages;
    const q = msgSearch.toLowerCase();
    return messages.filter(m=> m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q));
  },[messages, msgSearch]);
  const grouped = useMemo(()=>{
    const groups = []; let lastDay=null;
    filteredMsgs.forEach(m=>{ const d=dayLabel(m.created_at); if(d!==lastDay){ groups.push({ type:'day', label:d }); lastDay=d; } groups.push({ type:'msg', data:m }); });
    return groups;
  },[filteredMsgs]);
  const threadReplies = useMemo(()=> threadMsg? messages.filter(m=> m.replyToId===threadMsg.id): [],[messages, threadMsg]);
  const mediaGallery = useMemo(()=> messages.filter(m=> m.fileUrl && (m.messageType==='image' || m.messageType==='file')).slice(-12),[messages]);

  // mention list filtered
  const mentionList = useMemo(()=>{
    if(mentionQuery==null) return [];
    const q = mentionQuery.query.toLowerCase();
    return directory.filter(d=> `${d.firstName}${d.lastName}`.toLowerCase().includes(q) || d.employeeId.toLowerCase().includes(q)).slice(0,6);
  },[mentionQuery, directory]);

  // highlight mentions in content
  const renderContent = (text)=>{
    // mentions like @JohnDoe, and url, and search highlight
    let out = text;
    // simple mention highlight: words starting with @
    const parts = out.split(/(@\w+)/g);
    return parts.map((p,i)=>{
      if(p.startsWith('@')) return <Box key={i} component="span" sx={{ color:'#2563EB', fontWeight:700, bgcolor: starred.includes('mention')?'#FEF3C2':'transparent' }}>{p}</Box>;
      if(msgSearch && p.toLowerCase().includes(msgSearch.toLowerCase())) return <Box key={i} component="span" sx={{ bgcolor:'#FEF08A' }}>{highlight(p, msgSearch)}</Box>;
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <Box sx={{ display:'flex', height:'calc(100vh - 68px)', bgcolor:'#F8FAFD' }}>
      {/* Sidebar */}
      <Paper elevation={0} sx={{ width:380, display:{xs: selected? 'none':'flex', md:'flex'}, flexDirection:'column', borderRight:'1px solid #E8ECF5', borderRadius:0 }}>
        <Box sx={{ p:2, pb:1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'#EEF2FF', color:'#14286D', display:'flex', alignItems:'center', justifyContent:'center'}}><FiMessageCircle size={18}/></Box>
            <Box sx={{ flex:1 }}>
              <Typography fontWeight={800} color="#14286D">Messenger</Typography>
              <Typography variant="caption" color="text.secondary">{directory.length} colleagues • {online.length} online • {archived.length} archived</Typography>
            </Box>
            <Tooltip title={showArchived? 'Hide archived':'Show archived'}><IconButton size="small" onClick={()=>setShowArchived(v=>!v)} sx={{ bgcolor: showArchived?'#EEF2FF':'#F1F5F9' }}><FiArchive size={14}/></IconButton></Tooltip>
          </Stack>
          <TextField size="small" fullWidth placeholder="Search chats, @people, #groups" value={search} onChange={e=>setSearch(e.target.value)} InputProps={{ startAdornment:<InputAdornment position="start"><FiSearch size={16} color="#8A94B0"/></InputAdornment>}} sx={{ mt:2 }} />
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="fullWidth" sx={{ mt:1.5, minHeight:36, '& .MuiTab-root':{ minHeight:36, textTransform:'none', fontWeight:600, fontSize:12 }}}>
            <Tab icon={<FiMessageCircle size={14}/>} iconPosition="start" label={`Chats`} />
            <Tab icon={<FiUsers size={14}/>} iconPosition="start" label={`Groups`} />
            <Tab icon={<FiGrid size={14}/>} iconPosition="start" label="Directory" />
          </Tabs>
        </Box>
        <Divider />
        <Box sx={{ flex:1, overflowY:'auto' }}>
          {tab===0 && (
            <List dense sx={{ p:0 }}>
              <ListItem onClick={handleSelectCompany} selected={selected?.conversationId===companyRoom(company)} sx={{ borderBottom:'1px solid #F1F5F9', bgcolor: selected?.conversationId===companyRoom(company)?'#EEF2FF':undefined, cursor:'pointer' }}>
                <ListItemAvatar><Avatar sx={{ bgcolor:'#14286D' }}><HiOutlineBuildingOffice2 size={18}/></Avatar></ListItemAvatar>
                <ListItemText primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }} primary={<Box component="span" sx={{ display:'inline-flex', alignItems:'center', gap:0.5 }}><Typography component="span" fontWeight={700} fontSize={14}>{company}</Typography><Chip label="Company" size="small" sx={{ ml:1, height:18, fontSize:10 }}/></Box>} secondary="Company-wide • Pinned" />
                <FiMapPin size={12} color="#FE8600"/>
              </ListItem>
              {filteredConvs.map(c=>{
                const isOnline = online.some(id=> c.conversationId.includes(id));
                const otherId = c.conversationId.startsWith('dm:')? c.conversationId.replace('dm:','').split('_').find(x=>x!==meId): null;
                const user = directory.find(d=>d.employeeId===otherId);
                const isMuted = muted.includes(c.conversationId);
                const isPinned = JSON.parse(localStorage.getItem('pinnedConvs')||'[]').includes(c.conversationId);
                return (
                  <ListItem key={c.conversationId} onClick={()=>handleSelectConversation(c)} selected={selected?.conversationId===c.conversationId} sx={{ '&.Mui-selected':{ bgcolor:'#EEF2FF' }, opacity: isMuted?0.75:1, cursor:'pointer' }}>
                    <ListItemAvatar>
                      <Badge overlap="circular" variant="dot" color="success" invisible={!isOnline} anchorOrigin={{vertical:'bottom', horizontal:'right'}}>
                        <Avatar src={user?.photo||undefined} sx={{ bgcolor: isPinned?'#FEF3C2':'#E2E8F0', color:'#475569', fontSize:13, border: isPinned?'2px solid #F59E0B':'none' }}>{(user? `${user.firstName[0]}${user.lastName[0]}`: c.conversationId.slice(0,2)).toUpperCase()}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }} primary={<Stack direction="row" alignItems="center" spacing={0.5}><Typography component="span" fontWeight={600} fontSize={13} noWrap>{user? `${user.firstName} ${user.lastName}`: c.conversationId}</Typography>{isPinned&&<FiMapPin size={10} color="#D97706"/>}{isMuted&&<FiBell size={10} color="#94A3B8"/>}</Stack>} secondary={<Typography component="span" variant="caption" color="text.secondary" noWrap>{c.lastMessage?.senderName ? `${c.lastMessage.senderName}: ` : ''}{c.lastMessage?.content||''}</Typography>} />
                    <Box sx={{ ml:1, textAlign:'right', minWidth:56 }}>
                      <Typography variant="caption" color="text.secondary">{formatTime(c.lastMessage?.created_at)}</Typography>
                      <Box sx={{ display:'flex', justifyContent:'flex-end', gap:0.3, mt:0.3 }}>
                        {c.unread>0 && !isMuted && <Chip label={c.unread} size="small" color="primary" sx={{ height:18, minWidth:18, fontSize:11 }}/>}
                        {isMuted && <Chip label="Muted" size="small" variant="outlined" sx={{ height:16, fontSize:9 }}/>}
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
          {tab===1 && (
            <List dense>
              {workgroups.map(wg=>(
                <ListItem key={wg.partnerCompanyName} onClick={()=>handleSelectGroup(wg)} selected={selected?.conversationId===groupKey(company, wg.partnerCompanyName)} sx={{ cursor:'pointer' }}>
                  <ListItemAvatar><Avatar sx={{ bgcolor:'#FEF3E2', color:'#D97706' }}><FiUsers size={18}/></Avatar></ListItemAvatar>
                  <ListItemText primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }} primary={<Box component="span" sx={{ display:'inline-flex', alignItems:'center', gap:0.5 }}><Typography component="span" fontWeight={700} fontSize={13}>{wg.partnerCompanyName}</Typography><Chip label={wg.privacyType||'Private'} size="small" sx={{ ml:0.5, height:16, fontSize:9 }}/></Box>} secondary={`${company} • ${wg.partnerCompanyName}`} />
                </ListItem>
              ))}
            </List>
          )}
          {tab===2 && (
            <List dense>
              {filteredDirectory.map(u=>{
                const isMe = u.employeeId===meId;
                const isOn = online.includes(u.employeeId);
                return (
                  <ListItem key={u.employeeId} secondaryAction={!isMe && <Button size="small" variant="outlined" sx={{ textTransform:'none', borderRadius:2, fontSize:11 }} onClick={()=>handleSelectUser(u)}>Chat</Button>} sx={{ opacity: isMe?0.6:1 }}>
                    <ListItemAvatar><Badge overlap="circular" variant="dot" color="success" invisible={!isOn}><Avatar src={u.photo||undefined} sx={{ width:36, height:36 }}>{`${u.firstName[0]||''}${u.lastName[0]||''}`.toUpperCase()}</Avatar></Badge></ListItemAvatar>
                    <ListItemText primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }} primary={<Typography component="span" fontSize={13} fontWeight={600}>{u.firstName} {u.lastName} {isMe&&'(You)'} {online.includes(u.employeeId)&&<Box component="span" sx={{ fontSize:10, color:'#16A34A' }}>• Online</Box>}</Typography>} secondary={<Typography component="span" variant="caption" color="text.secondary" noWrap>{u.designation||u.role} • {u.department||'Unassigned'}</Typography>} />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
        <Box sx={{ p:1.5, borderTop:'1px solid #E8ECF5', bgcolor:'#fff' }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip size="small" icon={<FiCheckCircle size={12} color="#16A34A"/>} label="Socket.IO" variant="outlined" sx={{ fontSize:10 }} />
            <Chip size="small" icon={<FiStar size={12}/>} label={`${starred.length} starred`} variant="outlined" sx={{ fontSize:10 }} />
            <Chip size="small" icon={<FiMapPin size={12}/>} label={`${pinned.length} pinned`} variant="outlined" sx={{ fontSize:10 }} />
          </Stack>
        </Box>
      </Paper>

      {/* Main */}
      <Box sx={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, bgcolor:'#fff' }} onDragOver={e=>{e.preventDefault(); setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop} onPaste={onPaste}>
        {!selected ? (
          <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', p:4, textAlign:'center' }}>
            <Box sx={{ width:96, height:96, borderRadius:4, bgcolor:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', mb:2 }}><FiMessageCircle size={36} color="#14286D"/></Box>
            <Typography variant="h6" fontWeight={800} color="#14286D">Advanced Messenger</Typography>
            <Typography color="text.secondary" sx={{ maxWidth:520, mt:1, fontSize:13 }}>Now with threads, @mentions, pinned, starred, mute/archive, drag & drop, paste image, voice notes, infinite scroll, read receipts, presence, desktop notifications, quick replies, media gallery & forwarding. All company-scoped & encrypted.</Typography>
            <Stack direction="row" spacing={1} sx={{ mt:3 }}>
              <Button variant="contained" sx={{ bgcolor:'#14286D', textTransform:'none' }} onClick={()=>setTab(2)}>Browse Directory</Button>
              <Button variant="outlined" sx={{ textTransform:'none' }} onClick={handleSelectCompany}>Open Company Chat</Button>
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt:3, maxWidth:560, justifyContent:'center' }}>
              {['Threads','@Mentions','Pinned','Voice','Drag&Drop','Infinite scroll','Read receipts','Gallery'].map(f=> <Chip key={f} label={f} size="small" color="primary" variant="outlined"/>)}
            </Stack>
          </Box>
        ) : (
          <>
            {/* Header + pinned bar */}
            <Box sx={{ px:2, py:1, borderBottom:'1px solid #E8ECF5', bgcolor:'#fff' }}>
              <Box sx={{ height:48, display:'flex', alignItems:'center', gap:1.5 }}>
                <IconButton sx={{ display:{ md:'none' } }} onClick={()=>setSelected(null)}><FiX size={18}/></IconButton>
                <Avatar src={selected.photo||undefined} onClick={()=>setInfoOpen(true)} sx={{ width:40, height:40, bgcolor: selected.type==='group'?'#FEF3E2': selected.type==='company'?'#14286D':'#E2E8F0', cursor:'pointer' }}>{selected.type==='group'? <FiUsers size={18}/>: selected.type==='company'? <HiOutlineBuildingOffice2 size={18}/>: (selected.name.slice(0,2).toUpperCase())}</Avatar>
                <Box sx={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={()=>setInfoOpen(true)}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontWeight={800} fontSize={15} noWrap>{selected.name}</Typography>
                    {selected.type==='dm' && online.includes(selected.user?.employeeId) && <Chip label="Online" size="small" color="success" sx={{ height:16, fontSize:10 }}/>}
                    {muted.includes(selected.conversationId) && <Chip icon={<FiBell size={10}/>} label="Muted" size="small" variant="outlined" sx={{ height:18, fontSize:10 }}/>}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap>{typingUsers[selected.conversationId] ? `${typingUsers[selected.conversationId]} is typing… • ` : ''}{selected.subtitle || formatLastSeen(new Date().toISOString())}</Typography>
                </Box>
                <TextField size="small" placeholder="Search messages" value={msgSearch} onChange={e=>setMsgSearch(e.target.value)} InputProps={{ startAdornment:<InputAdornment position="start"><FiSearch size={14}/></InputAdornment>, endAdornment: msgSearch && <InputAdornment position="end"><IconButton size="small" onClick={()=>setMsgSearch('')}><FiX size={14}/></IconButton></InputAdornment>}} sx={{ width:200, display:{ xs:'none', lg:'flex' } }} />
                <Tooltip title="Media gallery"><IconButton onClick={()=>setInfoOpen(true)}><FiImage size={18}/></IconButton></Tooltip>
                <Tooltip title="Info"><IconButton onClick={()=>setInfoOpen(true)}><FiInfo size={18}/></IconButton></Tooltip>
                <IconButton onClick={(e)=>setShowAttachMenu(e.currentTarget)}><FiMoreVertical size={18}/></IconButton>
                <Menu anchorEl={showAttachMenu} open={Boolean(showAttachMenu)} onClose={()=>setShowAttachMenu(null)}>
                  <MenuItem onClick={()=>{ toggleMute(selected.conversationId); setShowAttachMenu(null); }}>{muted.includes(selected.conversationId)?'Unmute':'Mute'} conversation</MenuItem>
                  <MenuItem onClick={()=>{ const pinnedConvs = JSON.parse(localStorage.getItem('pinnedConvs')||'[]'); const isP = pinnedConvs.includes(selected.conversationId); const next = isP? pinnedConvs.filter(x=>x!==selected.conversationId): [...pinnedConvs, selected.conversationId]; localStorage.setItem('pinnedConvs', JSON.stringify(next)); setShowAttachMenu(null); }}>{JSON.parse(localStorage.getItem('pinnedConvs')||'[]').includes(selected.conversationId)?'Unpin':'Pin'} chat to top</MenuItem>
                  <MenuItem onClick={()=>{ toggleArchive(selected.conversationId); setShowAttachMenu(null); }}>{archived.includes(selected.conversationId)?'Unarchive':'Archive'} chat</MenuItem>
                  <MenuItem onClick={()=>{ setMessages([]); setShowAttachMenu(null); }}>Clear view (local)</MenuItem>
                </Menu>
              </Box>
              {pinned.length>0 && (
                <Paper variant="outlined" sx={{ mt:1, p:1, bgcolor:'#FFF7ED', borderColor:'#FDBA74', display:'flex', alignItems:'center', gap:1, borderRadius:2 }}>
                  <FiMapPin size={14} color="#D97706"/><Typography variant="caption" fontWeight={700} color="#9A3412">{pinned.length} pinned</Typography>
                  <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap', flex:1 }}>
                    {pinned.map(id=>{
                      const m = messages.find(x=>x.id===id);
                      return <Chip key={id} label={m? m.content.slice(0,28): id} size="small" onClick={()=>{ const el=document.getElementById(`msg-${id}`); el?.scrollIntoView({behavior:'smooth', block:'center'}); }} onDelete={()=>togglePin(id)} sx={{ height:20, fontSize:10 }}/>
                    })}
                  </Box>
                </Paper>
              )}
              {/* quick replies */}
              <Stack direction="row" spacing={0.7} sx={{ mt:1, overflowX:'auto', pb:0.5 }}>
                {QUICK_REPLIES.slice(0,4).map(q=> <Chip key={q} label={q} size="small" variant="outlined" onClick={()=> setInput(q)} sx={{ cursor:'pointer', fontSize:11, height:22 }}/>)}
              </Stack>
            </Box>

            {/* Messages viewport */}
            <Box ref={listRef} onScroll={onScroll} sx={{ flex:1, overflowY:'auto', p:2, bgcolor:'#F8FAFD', backgroundImage:'radial-gradient(#E8ECF5 1px, transparent 1px)', backgroundSize:'22px 22px', position:'relative' }}>
              {dragOver && <Paper sx={{ position:'absolute', inset:12, border:'2px dashed #14286D', bgcolor:'rgba(20,40,109,0.06)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', zIndex:5, backdropFilter:'blur(2px)' }}><Stack alignItems="center" spacing={1}><FiPaperclip size={28} color="#14286D"/><Typography fontWeight={700} color="#14286D">Drop file to send</Typography><Typography variant="caption" color="text.secondary">Images, PDFs, voice notes</Typography></Stack></Paper>}
              {loadingMsgs ? <Box sx={{ display:'flex', justifyContent:'center', py:6 }}><CircularProgress size={22}/></Box> : hasMore && <Button size="small" onClick={()=> loadMessages(selected.conversationId,{append:true})} sx={{ display:'block', mx:'auto', mb:2, textTransform:'none' }}>Load earlier messages</Button>}
              {grouped.length===0 ? (
                <Box sx={{ textAlign:'center', py:8 }}><Typography color="text.secondary">No messages yet — say hi 👋</Typography><Typography variant="caption" color="text.secondary">Try @mention, drag & drop, or voice note</Typography></Box>
              ) : grouped.map((g, idx)=>{
                if(g.type==='day') return <Box key={`day-${idx}`} sx={{ textAlign:'center', my:2 }}><Chip label={g.label} size="small" sx={{ bgcolor:'#fff', border:'1px solid #E8ECF5', fontSize:11 }}/></Box>;
                const m = g.data;
                const isMe = m.senderEmployeeId===meId;
                const reply = m.replyToId ? messages.find(x=>x.id===m.replyToId) : null;
                const isStarred = starred.includes(m.id);
                const isPinnedMsg = pinned.includes(m.id);
                return (
                  <Box key={m.id} id={`msg-${m.id}`} sx={{ display:'flex', justifyContent: isMe?'flex-end':'flex-start', mb:1.4, gap:1, opacity: archived.includes(selected.conversationId)?0.6:1 }}>
                    {!isMe && <Avatar src={m.senderPhoto||undefined} sx={{ width:28, height:28, mt:0.5, fontSize:11, cursor:'pointer' }} onClick={()=>setThreadMsg(m)}>{m.senderName.slice(0,2).toUpperCase()}</Avatar>}
                    <Box sx={{ maxWidth:'68%', position:'relative' }}>
                      {!isMe && <Stack direction="row" spacing={0.5} alignItems="center"><Typography variant="caption" fontWeight={700} color="#475569" sx={{ ml:1 }}>{m.senderName}</Typography><Typography variant="caption" sx={{ fontSize:9, opacity:0.6 }}>{m.senderEmployeeId}</Typography></Stack>}
                      <Paper elevation={0} onClick={()=> m.fileUrl && m.messageType==='image' && setLightbox(m.fileUrl)} sx={{ p: m.messageType==='image'?0.5:1.2, borderRadius: isMe? '16px 16px 4px 16px':'16px 16px 16px 4px', bgcolor: isMe?'#14286D':'#fff', color: isMe?'#fff':'#0F172A', border: isMe?'none':'1px solid #E8ECF5', overflow:'hidden', position:'relative', cursor: m.fileUrl? 'pointer': 'default' }}>
                        {isPinnedMsg && <Chip icon={<FiMapPin size={10}/>} label="Pinned" size="small" sx={{ position:'absolute', top:4, right:4, height:16, fontSize:9, bgcolor:'#FEF3C2' }}/>}
                        {isStarred && <FiStar size={10} color="#F59E0B" style={{ position:'absolute', top:6, left:6 }} />}
                        {reply && <Box onClick={()=> setThreadMsg(reply)} sx={{ mb:1, p:1, borderLeft:'3px solid #FE8600', bgcolor: isMe?'rgba(255,255,255,0.14)':'#FFF7ED', borderRadius:1, cursor:'pointer' }}><Typography variant="caption" fontWeight={700}>{reply.senderName}</Typography><Typography variant="caption" sx={{ display:'block', opacity:0.85, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:260 }}>{reply.content}</Typography></Box>}
                        {m.isDeleted ? <Typography variant="body2" sx={{ fontStyle:'italic', opacity:0.7 }}>This message was deleted</Typography> : (
                          <>
                            {m.messageType==='image' && m.fileUrl ? <Box component="img" src={m.fileUrl} alt={m.fileName} sx={{ maxWidth:280, maxHeight:220, borderRadius:1.5, display:'block', mb: m.content?1:0 }} /> : null}
                            {m.messageType==='file' && m.fileUrl ? <Button href={m.fileUrl} target="_blank" startIcon={<FiFileText/>} size="small" sx={{ color: isMe?'#fff':'#14286D', textTransform:'none', bgcolor: isMe?'rgba(255,255,255,0.12)':'#F1F5F9', mb:0.5 }}>{m.fileName||'Download file'}</Button> : null}
                            {m.messageType==='audio' && m.fileUrl ? <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: isMe?'rgba(255,255,255,0.12)':'#F1F5F9', p:1, borderRadius:2 }}><IconButton size="small" onClick={()=>{ const a=new Audio(m.fileUrl); a.play(); }}><FiPlay size={14}/></IconButton><FiVolume2 size={14}/><Typography variant="caption">Voice message</Typography><Typography variant="caption" sx={{ ml:'auto', opacity:0.7 }}>{m.content}</Typography></Stack> : null}
                            <Typography variant="body2" sx={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{renderContent(m.content)}</Typography>
                          </>
                        )}
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt:0.5 }}>
                          {m.isEdited && !m.isDeleted && <Typography variant="caption" sx={{ opacity:0.7, fontSize:10 }}>(edited)</Typography>}
                          <Typography variant="caption" sx={{ opacity:0.7, fontSize:10 }}>{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Typography>
                          {isMe && <><FiCheck size={12} color={isMe?'#fff':'#94A3B8'} /><FiCheck size={12} color={isMe?'#93C5FD':'#94A3B8'} style={{ marginLeft:-6 }} /></>}
                        </Stack>
                        {m.reactions && Object.keys(m.reactions).length>0 && (
                          <Stack direction="row" spacing={0.4} sx={{ mt:0.6, flexWrap:'wrap' }}>
                            {Object.entries(m.reactions).map(([emoji, users])=>(
                              <Chip key={emoji} label={`${emoji} ${users.length}`} size="small" onClick={()=>handleReaction(m, emoji)} sx={{ height:20, fontSize:11, bgcolor: users.includes(String(JSON.parse(localStorage.getItem('userId')||'0')))?'#EEF2FF':'#fff', border:'1px solid #E2E8F0' }} />
                            ))}
                          </Stack>
                        )}
                      </Paper>
                      <Stack direction="row" spacing={0.3} sx={{ mt:0.3, justifyContent: isMe?'flex-end':'flex-start', opacity:0.0, ':hover':{opacity:1}, transition:'opacity 0.15s', flexWrap:'wrap' }} className="msg-actions">
                        <Tooltip title="Reply"><IconButton size="small" onClick={()=>setReplyTo(m)}><FiCornerUpLeft size={12}/></IconButton></Tooltip>
                        <Tooltip title="Thread"><IconButton size="small" onClick={()=>setThreadMsg(m)}><FiMessageCircle size={12}/></IconButton></Tooltip>
                        <Tooltip title="React"><IconButton size="small" onClick={(e)=>{ setActiveMsg(m); setAnchorMsg(e.currentTarget); }}><FiSmile size={12}/></IconButton></Tooltip>
                        <Tooltip title={isStarred?'Unstar':'Star'}><IconButton size="small" onClick={()=>toggleStar(m.id)}><FiStar size={12} color={isStarred?'#F59E0B':undefined}/></IconButton></Tooltip>
                        <Tooltip title={isPinnedMsg?'Unpin':'Pin'}><IconButton size="small" onClick={()=>togglePin(m.id)}><FiMapPin size={12} color={isPinnedMsg?'#D97706':undefined}/></IconButton></Tooltip>
                        <Tooltip title="Copy"><IconButton size="small" onClick={()=>handleCopy(m.content)}><FiCopy size={12}/></IconButton></Tooltip>
                        <Tooltip title="Forward"><IconButton size="small" onClick={()=>setForwardMsg(m)}><FiCornerUpRight size={12}/></IconButton></Tooltip>
                        {isMe && !m.isDeleted && <>
                          <IconButton size="small" onClick={()=>handleEdit(m)}><FiEdit2 size={12}/></IconButton>
                          <IconButton size="small" onClick={()=>handleDelete(m)}><FiTrash2 size={12}/></IconButton>
                        </>}
                      </Stack>
                      {threadReplies.filter(r=> r.replyToId===m.id).length>0 && (
                        <Button size="small" onClick={()=>setThreadMsg(m)} sx={{ mt:0.5, textTransform:'none', fontSize:11, height:20, borderRadius:2 }} startIcon={<FiMessageCircle size={12}/>}>
                          {threadReplies.filter(r=> r.replyToId===m.id).length} repl{threadReplies.filter(r=> r.replyToId===m.id).length===1?'y':'ies'} — View thread
                        </Button>
                      )}
                    </Box>
                    {isMe && <Avatar sx={{ width:28, height:28, bgcolor:'#14286D', fontSize:11, mt:0.5 }}>{meName.slice(0,2).toUpperCase()}</Avatar>}
                  </Box>
                );
              })}
              {typingUsers[selected.conversationId] && <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:1 }}><Avatar sx={{ width:20, height:20, bgcolor:'#E2E8F0', fontSize:10 }}>{typingUsers[selected.conversationId].slice(0,2).toUpperCase()}</Avatar><Paper sx={{ px:1.5, py:0.8, borderRadius:3, bgcolor:'#fff', border:'1px solid #E8ECF5' }}><Typography variant="caption" color="text.secondary">{typingUsers[selected.conversationId]} typing…</Typography></Paper></Box>}
            </Box>

            {/* Reply / Edit bar */}
            {(replyTo || editing) && (
              <Box sx={{ px:2, py:1, bgcolor: editing?'#EEF2FF':'#FFF7ED', borderTop: editing?'1px solid #C7D2FE':'1px solid #FDBA74', display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ width:3, height:36, bgcolor: editing?'#6366F1':'#FE8600', borderRadius:1 }} />
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography variant="caption" fontWeight={700} color={editing?'#3730A3':'#9A3412'}>{editing? 'Editing message':'Replying to ' + replyTo.senderName}</Typography>
                  <Typography variant="caption" noWrap sx={{ display:'block', opacity:0.8 }}>{editing? editing.content: replyTo.content}</Typography>
                </Box>
                <IconButton size="small" onClick={()=>{setReplyTo(null); setEditing(null);}}><FiX size={16}/></IconButton>
              </Box>
            )}

            {/* File preview */}
            {previewFile && (
              <Paper elevation={0} sx={{ p:1.5, borderTop:'1px solid #E8ECF5', bgcolor:'#F8FAFD', display:'flex', alignItems:'center', gap:2 }}>
                {previewFile.url ? <Box component="img" src={previewFile.url} sx={{ width:64, height:64, objectFit:'cover', borderRadius:1.5, border:'1px solid #E2E8F0' }}/> : <Box sx={{ width:48, height:48, borderRadius:1.5, bgcolor:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center' }}><FiFileText size={20}/></Box>}
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography fontWeight={600} fontSize={13} noWrap>{previewFile.file.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{(previewFile.file.size/1024).toFixed(1)} KB • {previewFile.file.type||'file'}</Typography>
                  {uploadProgress>0 && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt:0.5, height:4, borderRadius:2 }}/>}
                </Box>
                <Button size="small" variant="contained" onClick={confirmSendFile} sx={{ bgcolor:'#14286D' }}>Send</Button>
                <IconButton size="small" onClick={()=>setPreviewFile(null)}><FiX size={16}/></IconButton>
              </Paper>
            )}

            {/* Composer */}
            <Box sx={{ p:1.2, borderTop:'1px solid #E8ECF5', bgcolor:'#fff', display:'flex', alignItems:'flex-end', gap:0.8 }}>
              <input ref={fileRef} type="file" hidden onChange={e=>{ const f=e.target.files?.[0]; if(f) sendFile(f); e.target.value=''; }} />
              <Tooltip title="Attach file"><IconButton onClick={()=>{ fileRef.current.accept='*/*'; fileRef.current?.click(); }} sx={{ bgcolor:'#F1F5F9' }}><FiPaperclip size={16}/></IconButton></Tooltip>
              <Tooltip title="Image"><IconButton onClick={()=>{ fileRef.current.accept='image/*'; fileRef.current?.click(); }} sx={{ bgcolor:'#F1F5F9' }}><FiImage size={16}/></IconButton></Tooltip>
              <Tooltip title={isRecording?'Stop recording':'Voice note'}><IconButton onClick={isRecording? stopRecording: startRecording} sx={{ bgcolor: isRecording?'#FEE2E2':'#F1F5F9', color: isRecording?'#DC2626':undefined, animation: isRecording?'pulse 1s infinite':undefined }}><FiMic size={16}/></IconButton></Tooltip>
              {isRecording && <Chip label={`${Math.floor(recordSecs/60)}:${String(recordSecs%60).padStart(2,'0')}`} color="error" size="small" icon={<FiStopCircle size={12}/>} />}
              <Box sx={{ flex:1, position:'relative' }}>
                <TextField inputRef={inputRef} fullWidth multiline minRows={1} maxRows={5} placeholder={editing? 'Edit message… (Enter to save)':'Type a message…  @ to mention  •  Enter to send'} value={input} onChange={e=>onInputChange(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); }}} onPaste={onPaste} size="small" sx={{ '& .MuiOutlinedInput-root':{ borderRadius:3, bgcolor:'#F8FAFD', pr:0.5 } }} />
                {mentionQuery && mentionList.length>0 && (
                  <Paper elevation={4} sx={{ position:'absolute', bottom:44, left:0, right:0, maxHeight:180, overflowY:'auto', zIndex:10, borderRadius:2, border:'1px solid #E2E8F0' }}>
                    <List dense>
                      {mentionList.map(u=>(
                        <ListItem key={u.employeeId} onClick={()=>insertMention(u)} sx={{ cursor:'pointer' }}>
                          <ListItemAvatar><Avatar src={u.photo||undefined} sx={{ width:28, height:28 }}>{`${u.firstName[0]}${u.lastName[0]}`.toUpperCase()}</Avatar></ListItemAvatar>
                          <ListItemText primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }} primary={`${u.firstName} ${u.lastName}`} secondary={`@${u.firstName}${u.lastName} • ${u.designation||''}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
              <Tooltip title="Emoji"><IconButton onClick={()=>setShowEmoji(v=>!v)} sx={{ bgcolor: showEmoji?'#EEF2FF':'#F1F5F9' }}><FiSmile size={18}/></IconButton></Tooltip>
              <Button variant="contained" onClick={send} disabled={!input.trim() && !previewFile} sx={{ borderRadius:3, minWidth:48, height:40, bgcolor:'#14286D', '&:hover':{ bgcolor:'#0F1F57' } }}><FiSend size={18}/></Button>
            </Box>
            {isRecording && <Box sx={{ px:2, pb:1, display:'flex', alignItems:'center', gap:1 }}><FiVolume2 size={14} color="#DC2626"/><LinearProgress sx={{ flex:1, height:4, borderRadius:2 }} color="error" /><Typography variant="caption" color="error">Recording… tap mic to stop & send</Typography></Box>}
            {showEmoji && (
              <Paper elevation={3} sx={{ p:1, borderTop:'1px solid #E8ECF5', maxHeight:170, overflowY:'auto' }}>
                <Box sx={{ display:'flex', gap:0.5, mb:1, flexWrap:'wrap' }}>
                  {QUICK_EMOJIS.map(e=> <Chip key={e} label={e} onClick={()=>{ setInput(p=>p+e); setShowEmoji(false); }} sx={{ cursor:'pointer' }} />)}
                </Box>
                <Divider sx={{ mb:1 }}/>
                <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.4 }}>
                  {EMOJI_PICKER.map(e=> <IconButton key={e} size="small" onClick={()=> setInput(p=>p+e)} sx={{ width:30, height:30, fontSize:16 }}>{e}</IconButton>)}
                </Box>
              </Paper>
            )}
            <Menu anchorEl={anchorMsg} open={Boolean(anchorMsg)} onClose={()=>setAnchorMsg(null)} PaperProps={{ sx:{ p:0.5, borderRadius:3 }}}>
              <Box sx={{ display:'flex', gap:0.5, p:0.5 }}>
                {QUICK_EMOJIS.slice(0,6).map(emoji=>(
                  <IconButton key={emoji} size="small" onClick={()=>{ if(activeMsg) handleReaction(activeMsg, emoji); setAnchorMsg(null); }}>{emoji}</IconButton>
                ))}
              </Box>
            </Menu>
          </>
        )}
      </Box>

      {/* Thread Drawer */}
      <Drawer anchor="right" open={Boolean(threadMsg)} onClose={()=>setThreadMsg(null)} PaperProps={{ sx:{ width:360, display:'flex', flexDirection:'column' }}}>
        {threadMsg && (
          <>
            <Box sx={{ p:2, borderBottom:'1px solid #E8ECF5', display:'flex', alignItems:'center', gap:1 }}>
              <FiMessageCircle size={16} color="#14286D"/><Typography fontWeight={800}>Thread</Typography><Chip label={`${threadReplies.length} repl${threadReplies.length===1?'y':'ies'}`} size="small" sx={{ ml:'auto' }}/><IconButton size="small" onClick={()=>setThreadMsg(null)}><FiX size={16}/></IconButton>
            </Box>
            <Box sx={{ p:2, bgcolor:'#F8FAFD', borderBottom:'1px solid #E8ECF5' }}>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <Avatar src={threadMsg.senderPhoto||undefined} sx={{ width:32, height:32 }}>{threadMsg.senderName.slice(0,2)}</Avatar>
                <Box><Typography fontWeight={700} fontSize={13}>{threadMsg.senderName}</Typography><Typography variant="caption" color="text.secondary">{new Date(threadMsg.created_at).toLocaleString()}</Typography><Typography variant="body2" sx={{ mt:0.5, whiteSpace:'pre-wrap' }}>{threadMsg.content}</Typography></Box>
              </Stack>
            </Box>
            <Box sx={{ flex:1, overflowY:'auto', p:2 }}>
              {threadReplies.length===0? <Typography variant="caption" color="text.secondary" sx={{ textAlign:'center', display:'block', py:4 }}>No replies yet — be the first</Typography>:
                threadReplies.map(r=>(
                  <Stack key={r.id} direction="row" spacing={1} sx={{ mb:1.5 }}>
                    <Avatar src={r.senderPhoto||undefined} sx={{ width:28, height:28, fontSize:11 }}>{r.senderName.slice(0,2)}</Avatar>
                    <Paper variant="outlined" sx={{ p:1, flex:1, borderRadius:2, bgcolor:'#fff' }}>
                      <Typography fontWeight={600} fontSize={12}>{r.senderName} <Typography component="span" variant="caption" color="text.secondary">{formatTime(r.created_at)}</Typography></Typography>
                      <Typography variant="body2" sx={{ whiteSpace:'pre-wrap' }}>{r.content}</Typography>
                    </Paper>
                  </Stack>
                ))}
            </Box>
            <Box sx={{ p:1.5, borderTop:'1px solid #E8ECF5', display:'flex', gap:1 }}>
              <TextField size="small" fullWidth placeholder="Reply in thread..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const prev=replyTo; setReplyTo(threadMsg); send().then(()=> setReplyTo(prev)); }}} />
              <IconButton onClick={()=>{ const prev=replyTo; setReplyTo(threadMsg); send().then(()=> setReplyTo(prev)); }} sx={{ bgcolor:'#14286D', color:'#fff' }}><FiSend size={14}/></IconButton>
            </Box>
          </>
        )}
      </Drawer>

      {/* Info Drawer */}
      <Drawer anchor="right" open={infoOpen} onClose={()=>setInfoOpen(false)} PaperProps={{ sx:{ width:340 }}}>
        {selected && (
          <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <Box sx={{ p:2, borderBottom:'1px solid #E8ECF5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <Typography fontWeight={800}>Info</Typography><IconButton size="small" onClick={()=>setInfoOpen(false)}><FiX size={16}/></IconButton>
            </Box>
            <Box sx={{ p:2, textAlign:'center', borderBottom:'1px solid #E8ECF5' }}>
              <Avatar src={selected.photo||undefined} sx={{ width:64, height:64, mx:'auto', bgcolor: selected.type==='group'?'#FEF3E2':'#14286D' }}>{selected.name.slice(0,2).toUpperCase()}</Avatar>
              <Typography fontWeight={800} sx={{ mt:1 }}>{selected.name}</Typography>
              <Typography variant="caption" color="text.secondary">{selected.subtitle}</Typography>
              {selected.type==='dm' && selected.user && <Stack spacing={0.5} sx={{ mt:1, textAlign:'left', bgcolor:'#F8FAFD', p:1, borderRadius:2 }}>
                <Typography variant="caption"><b>Email:</b> {selected.user.email}</Typography>
                <Typography variant="caption"><b>Dept:</b> {selected.user.department||'—'}</Typography>
                <Typography variant="caption"><b>Role:</b> {selected.user.role}</Typography>
                <Typography variant="caption"><b>Designation:</b> {selected.user.designation||'—'}</Typography>
              </Stack>}
            </Box>
            <Box sx={{ p:2, flex:1, overflowY:'auto' }}>
              <Typography fontWeight={700} fontSize={12} color="#475569" sx={{ mb:1 }}>Shared Media ({mediaGallery.length})</Typography>
              {mediaGallery.length===0? <Typography variant="caption" color="text.secondary">No media yet</Typography> :
                <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1 }}>
                  {mediaGallery.map(m=>(
                    <Box key={m.id} onClick={()=> m.messageType==='image' && setLightbox(m.fileUrl)} sx={{ aspectRatio:'1', borderRadius:1.5, overflow:'hidden', border:'1px solid #E2E8F0', cursor:'pointer', bgcolor:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {m.messageType==='image'? <Box component="img" src={m.fileUrl} sx={{ width:'100%', height:'100%', objectFit:'cover' }}/>: <Stack alignItems="center"><FiFileText size={18}/><Typography variant="caption" noWrap sx={{ maxWidth:80 }}>{m.fileName}</Typography></Stack>}
                    </Box>
                  ))}
                </Box>}
              <Divider sx={{ my:2 }}/>
              <Typography fontWeight={700} fontSize={12} color="#475569">Conversation settings</Typography>
              <List dense>
                <ListItem><FiBell size={14} style={{ marginRight:8 }}/><ListItemText primary={muted.includes(selected.conversationId)?'Unmute':'Mute'} secondary="No notifications" /><Button size="small" onClick={()=>toggleMute(selected.conversationId)}>{muted.includes(selected.conversationId)?'Unmute':'Mute'}</Button></ListItem>
                <ListItem><FiMapPin size={14} style={{ marginRight:8 }}/><ListItemText primary="Pin chat" secondary="Keep on top" /><Button size="small" onClick={()=>{ const pinnedConvs = JSON.parse(localStorage.getItem('pinnedConvs')||'[]'); const isP = pinnedConvs.includes(selected.conversationId); const next = isP? pinnedConvs.filter(x=>x!==selected.conversationId): [...pinnedConvs, selected.conversationId]; localStorage.setItem('pinnedConvs', JSON.stringify(next)); }}>Toggle</Button></ListItem>
                <ListItem><FiArchive size={14} style={{ marginRight:8 }}/><ListItemText primary="Archive" /><Button size="small" onClick={()=>toggleArchive(selected.conversationId)}>{archived.includes(selected.conversationId)?'Unarchive':'Archive'}</Button></ListItem>
              </List>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Forward picker */}
      <Dialog open={Boolean(forwardMsg)} onClose={()=>setForwardMsg(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Forward message</DialogTitle>
        <DialogContent dividers sx={{ p:0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px:2, pt:1, display:'block' }}>Select a conversation</Typography>
          <List dense>
            <ListItem onClick={()=>handleForward(companyRoom(company))} sx={{ cursor:'pointer' }}><ListItemAvatar><Avatar sx={{ bgcolor:'#14286D' }}><HiOutlineBuildingOffice2 size={16}/></Avatar></ListItemAvatar><ListItemText primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }} primary={company} secondary="Company channel"/></ListItem>
            {conversations.slice(0,12).map(c=>(
              <ListItem key={c.conversationId} onClick={()=>handleForward(c.conversationId)} sx={{ cursor:'pointer' }}><ListItemText primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }} primary={c.conversationId} secondary={c.lastMessage?.content?.slice(0,40)||''}/></ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions><Button onClick={()=>setForwardMsg(null)}>Cancel</Button></DialogActions>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={Boolean(lightbox)} onClose={()=>setLightbox(null)} maxWidth="lg" fullWidth PaperProps={{ sx:{ bgcolor:'transparent', boxShadow:'none' }}}>
        <Box sx={{ position:'relative', display:'flex', justifyContent:'center', p:2 }}>
          <IconButton onClick={()=>setLightbox(null)} sx={{ position:'absolute', top:8, right:8, bgcolor:'rgba(0,0,0,0.6)', color:'#fff' }}><FiX size={18}/></IconButton>
          <Box component="img" src={lightbox||''} sx={{ maxWidth:'90vw', maxHeight:'85vh', borderRadius:2, boxShadow:3 }}/>
        </Box>
      </Dialog>
    </Box>
  );
}
