const { CrmLead, CrmAccount, CrmOpportunity, CrmActivity } = require('../models');
const { Op } = require('sequelize');

// helpers
const companyFilter = (req) => req.query.companyName || req.user?.companyName || req.body?.companyName;

// Leads
exports.listLeads = async (req,res)=>{
  const companyName = companyFilter(req);
  if(!companyName) return res.status(400).json({error:'companyName required'});
  const where={ companyName };
  if(req.query.status && req.query.status!=='All') where.status=req.query.status;
  if(req.query.search){
    const q=`%${req.query.search}%`;
    where[Op.or]=[{firstName:{[Op.iLike]:q}},{lastName:{[Op.iLike]:q}},{email:{[Op.iLike]:q}},{accountName:{[Op.iLike]:q}}];
  }
  const rows = await CrmLead.findAll({ where, order:[['created_at','DESC']] });
  res.json(rows);
};
exports.createLead = async (req,res)=>{
  const companyName = companyFilter(req);
  const { firstName, lastName, email, phone, accountName, source, status, score, value, assignedTo, notes } = req.body;
  if(!firstName || !lastName) return res.status(400).json({error:'firstName/lastName required'});
  const row = await CrmLead.create({ companyName, firstName, lastName, email, phone, accountName, source, status: status||'New', score: score||50, value: value||0, assignedTo: assignedTo||req.user?.employeeId, notes, createdBy: req.user?.employeeId });
  res.status(201).json(row);
};
exports.updateLead = async (req,res)=>{
  const row = await CrmLead.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.update(req.body);
  res.json(row);
};
exports.deleteLead = async (req,res)=>{
  const row = await CrmLead.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.destroy();
  res.json({success:true});
};
exports.convertLead = async (req,res)=>{
  const lead = await CrmLead.findByPk(req.params.id);
  if(!lead) return res.status(404).json({error:'Not found'});
  const account = await CrmAccount.create({ companyName: lead.companyName, name: lead.accountName || `${lead.firstName} ${lead.lastName} Co.`, industry:'General', ownerId: lead.assignedTo });
  const opp = await CrmOpportunity.create({ companyName: lead.companyName, title: `${lead.firstName} ${lead.lastName} — Opportunity`, accountId: account.id, leadId: lead.id, amount: lead.value||5000, stage:'Qualified', probability:40, assignedTo: lead.assignedTo, createdBy: req.user?.employeeId });
  await lead.update({ status:'Converted' });
  res.json({ account, opportunity: opp });
};

// Accounts
exports.listAccounts = async (req,res)=>{
  const companyName = companyFilter(req);
  const rows = await CrmAccount.findAll({ where:{ companyName }, order:[['created_at','DESC']] });
  res.json(rows);
};
exports.createAccount = async (req,res)=>{
  const companyName = companyFilter(req);
  const { name, industry, size, website, city, ownerId } = req.body;
  if(!name) return res.status(400).json({error:'name required'});
  const row = await CrmAccount.create({ companyName, name, industry, size, website, city, ownerId: ownerId||req.user?.employeeId });
  res.status(201).json(row);
};
exports.updateAccount = async (req,res)=>{
  const row = await CrmAccount.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.update(req.body);
  res.json(row);
};
exports.deleteAccount = async (req,res)=>{
  const row = await CrmAccount.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.destroy(); res.json({success:true});
};

// Opportunities
exports.listOpportunities = async (req,res)=>{
  const companyName = companyFilter(req);
  const where={ companyName };
  if(req.query.stage && req.query.stage!=='All') where.stage=req.query.stage;
  const rows = await CrmOpportunity.findAll({ where, order:[['created_at','DESC']] });
  res.json(rows);
};
exports.createOpportunity = async (req,res)=>{
  const companyName = companyFilter(req);
  const { title, accountId, amount, stage, probability, closeDate, assignedTo } = req.body;
  if(!title) return res.status(400).json({error:'title required'});
  const row = await CrmOpportunity.create({ companyName, title, accountId: accountId||null, amount: amount||0, stage: stage||'Lead', probability: probability||20, closeDate: closeDate||null, assignedTo: assignedTo||req.user?.employeeId, createdBy: req.user?.employeeId });
  res.status(201).json(row);
};
exports.updateOpportunity = async (req,res)=>{
  const row = await CrmOpportunity.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.update(req.body);
  res.json(row);
};
exports.deleteOpportunity = async (req,res)=>{
  const row = await CrmOpportunity.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.destroy(); res.json({success:true});
};

// Activities
exports.listActivities = async (req,res)=>{
  const companyName = companyFilter(req);
  const rows = await CrmActivity.findAll({ where:{ companyName }, order:[['dueDate','ASC'],['created_at','DESC']] });
  res.json(rows);
};
exports.createActivity = async (req,res)=>{
  const companyName = companyFilter(req);
  const { type, subject, description, relatedType, relatedId, dueDate } = req.body;
  if(!subject) return res.status(400).json({error:'subject required'});
  const row = await CrmActivity.create({ companyName, type:type||'Call', subject, description, relatedType: relatedType||null, relatedId: relatedId||null, dueDate: dueDate||null, createdBy: req.user?.employeeId });
  res.status(201).json(row);
};
exports.updateActivity = async (req,res)=>{
  const row = await CrmActivity.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.update(req.body);
  res.json(row);
};
exports.deleteActivity = async (req,res)=>{
  const row = await CrmActivity.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.destroy(); res.json({success:true});
};

// Stats
exports.stats = async (req,res)=>{
  const companyName = companyFilter(req);
  const [leads, opps, acts] = await Promise.all([
    CrmLead.findAll({ where:{ companyName } }),
    CrmOpportunity.findAll({ where:{ companyName } }),
    CrmActivity.findAll({ where:{ companyName } }),
  ]);
  const totalValue = opps.reduce((s,o)=> s+Number(o.amount||0),0);
  const won = opps.filter(o=>o.stage==='Closed Won');
  const lost = opps.filter(o=>o.stage==='Closed Lost');
  const funnel = ['Lead','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'].map(stage=> ({ stage, count: opps.filter(o=>o.stage===stage).length, value: opps.filter(o=>o.stage===stage).reduce((s,o)=>s+Number(o.amount||0),0) }));
  const bySource = {};
  leads.forEach(l=>{ bySource[l.source||'Other']=(bySource[l.source||'Other']||0)+1; });
  const byStatus = {};
  leads.forEach(l=>{ byStatus[l.status||'New']=(byStatus[l.status||'New']||0)+1; });
  res.json({
    leads: { total: leads.length, byStatus, bySource, converted: leads.filter(l=>l.status==='Converted').length },
    opportunities: { total: opps.length, totalValue, won: won.length, lost: lost.length, funnel, avgDeal: opps.length? Math.round(totalValue/opps.length):0 },
    activities: { total: acts.length, pending: acts.filter(a=>!a.done).length, overdue: acts.filter(a=> a.dueDate && !a.done && new Date(a.dueDate) < new Date()).length },
  });
};
