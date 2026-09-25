import axios from '../../../api/axios';

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const company = () => localStorage.getItem('companyName') || '';

export const fetchTasks = (params={}) => axios.get('/tasks', { headers: auth(), params: { companyName: company(), ...params } }).then(r=>r.data);
export const fetchUsers = (params={}) => axios.get('/users/employees', { headers: auth(), params:{ companyName: company(), ...params } }).then(r=>r.data);
export const createTask = (payload) => axios.post('/tasks', { ...payload, companyName: company() }, { headers: auth() }).then(r=>r.data);
export const updateTask = (id, payload) => axios.put(`/tasks/${id}`, payload, { headers: auth() }).then(r=>r.data);
export const deleteTask = (id) => axios.delete(`/tasks/${id}`, { headers: auth() }).then(r=>r.data);
export const getTask = (id) => axios.get(`/tasks/${id}`, { headers: auth() }).then(r=>r.data);
export const changeStatus = (id, action) => axios.post(`/tasks/${id}/status`, { action }, { headers: auth() }).then(r=>r.data);

export const fetchActivities = (id) => axios.get(`/tasks/${id}/activities`, { headers: auth() }).then(r=>r.data);
export const addChecklist = (id, title) => axios.post(`/tasks/${id}/checklist`, { title }, { headers: auth() }).then(r=>r.data);
export const toggleChecklist = (id) => axios.patch(`/tasks/checklist/${id}/toggle`, {}, { headers: auth() }).then(r=>r.data);
export const deleteChecklist = (id) => axios.delete(`/tasks/checklist/${id}`, { headers: auth() }).then(r=>r.data);

export const addMember = (taskId, type, userId) => axios.post(`/tasks/${taskId}/members`, { type, userId }, { headers: auth() }).then(r=>r.data);
export const removeMember = (memberId) => axios.delete(`/tasks/members/${memberId}`, { headers: auth() }).then(r=>r.data);

// bulk
export const bulkUpdate = (ids, payload) => Promise.all(ids.map(id=> updateTask(id, payload)));
export const bulkDelete = (ids) => Promise.all(ids.map(deleteTask));
export const bulkStatus = (ids, action) => Promise.all(ids.map(id=> changeStatus(id, action)));
