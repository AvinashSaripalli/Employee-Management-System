import axios from '../../../api/axios';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const company = () => localStorage.getItem('companyName') || '';

export const getStats = () => axios.get('/crm/stats', { headers: auth(), params:{ companyName: company() } }).then(r=>r.data);
export const listLeads = (params={}) => axios.get('/crm/leads', { headers: auth(), params:{ companyName: company(), ...params }}).then(r=>r.data);
export const createLead = (data) => axios.post('/crm/leads', { ...data, companyName: company() }, { headers: auth() }).then(r=>r.data);
export const updateLead = (id,data) => axios.put(`/crm/leads/${id}`, data, { headers: auth() }).then(r=>r.data);
export const deleteLead = (id) => axios.delete(`/crm/leads/${id}`, { headers: auth() }).then(r=>r.data);
export const convertLead = (id) => axios.post(`/crm/leads/${id}/convert`, {}, { headers: auth() }).then(r=>r.data);

export const listAccounts = () => axios.get('/crm/accounts', { headers: auth(), params:{ companyName: company() }}).then(r=>r.data);
export const createAccount = (data) => axios.post('/crm/accounts', { ...data, companyName: company() }, { headers: auth() }).then(r=>r.data);
export const updateAccount = (id,data) => axios.put(`/crm/accounts/${id}`, data, { headers: auth() }).then(r=>r.data);
export const deleteAccount = (id) => axios.delete(`/crm/accounts/${id}`, { headers: auth() }).then(r=>r.data);

export const listOpps = (params={}) => axios.get('/crm/opportunities', { headers: auth(), params:{ companyName: company(), ...params }}).then(r=>r.data);
export const createOpp = (data) => axios.post('/crm/opportunities', { ...data, companyName: company() }, { headers: auth() }).then(r=>r.data);
export const updateOpp = (id,data) => axios.put(`/crm/opportunities/${id}`, data, { headers: auth() }).then(r=>r.data);
export const deleteOpp = (id) => axios.delete(`/crm/opportunities/${id}`, { headers: auth() }).then(r=>r.data);

export const listActivities = () => axios.get('/crm/activities', { headers: auth(), params:{ companyName: company() }}).then(r=>r.data);
export const createActivity = (data) => axios.post('/crm/activities', { ...data, companyName: company() }, { headers: auth() }).then(r=>r.data);
export const updateActivity = (id,data) => axios.put(`/crm/activities/${id}`, data, { headers: auth() }).then(r=>r.data);
export const deleteActivity = (id) => axios.delete(`/crm/activities/${id}`, { headers: auth() }).then(r=>r.data);
