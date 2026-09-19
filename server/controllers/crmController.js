const { CrmLead, CrmAccount, CrmOpportunity, CrmActivity, CrmContact, CrmProduct, CrmQuote } = require('../models');
const { Op } = require('sequelize');

const companyFilter = (req) => req.query.companyName || req.user?.companyName || req.body?.companyName;

// AI scoring helper - senior CRM logic
function computeHealth(lead){
  let score = Number(lead.score||50);
  if(lead.status==='Qualified') score+=15;
  if(lead.status==='Converted') score=100;
  if(lead.status==='Lost') score=10;
  if(lead.source==='Referral') score+=10;
  if(Number(lead.value)>30000) score+=5;
  return Math.min(100, Math.max(0, score));
}
function nextBestAction(lead){
  if(lead.status==='New') return 'Call within 24h — high intent warm lead';
  if(lead.status==='Contacted') return 'Send tailored demo — check industry pain';
  if(lead.status==='Qualified') return 'Prepare proposal — budget approved';
  if(lead.health==='Hot') return 'Fast-track to opportunity';
  return 'Nurture with case study';
}

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
  // enrich with health & duplicate flag
  const emailMap={};
  rows.forEach(r=>{ emailMap[r.email]=(emailMap[r.email]||0)+1 });
  const out = rows.map(r=>{
    const j=r.toJSON();
    j.healthScore = computeHealth(j);
    j.health = j.healthScore>75? 'Hot': j.healthScore>45? 'Warm':'Cold';
    j.isDuplicate = j.email && emailMap[j.email]>1;
    j.nextAction = nextBestAction({...j, health:j.health});
    return j;
  });
  res.json(out);
};
exports.createLead = async (req,res)=>{
  const companyName = companyFilter(req);
  const { firstName, lastName, email, phone, accountName, source, status, score, value, assignedTo, notes, tags, lastContacted, nextFollowUp } = req.body;
  if(!firstName || !lastName) return res.status(400).json({error:'firstName/lastName required'});
  const row = await CrmLead.create({ companyName, firstName, lastName, email, phone, accountName, source, status: status||'New', score: score||50, value: value||0, assignedTo: assignedTo||req.user?.employeeId, notes, tags, lastContacted, nextFollowUp, createdBy: req.user?.employeeId });
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
  await CrmContact.create({ companyName: lead.companyName, accountId: account.id, firstName: lead.firstName, lastName: lead.lastName, email: lead.email, phone: lead.phone, title:'Primary Contact', ownerId: lead.assignedTo, isPrimary:true });
  const opp = await CrmOpportunity.create({ companyName: lead.companyName, title: `${lead.firstName} ${lead.lastName} — Opportunity`, accountId: account.id, leadId: lead.id, amount: lead.value||5000, stage:'Qualified', probability:40, stageEnteredAt: new Date(), assignedTo: lead.assignedTo, createdBy: req.user?.employeeId });
  await lead.update({ status:'Converted' });
  res.json({ account, opportunity: opp });
};

// Accounts
exports.listAccounts = async (req,res)=>{
  const companyName = companyFilter(req);
  const rows = await CrmAccount.findAll({ where:{ companyName }, order:[['created_at','DESC']] });
  // add computed opp count/value
  const opps = await CrmOpportunity.findAll({ where:{ companyName } });
  const out = rows.map(r=>{
    const j=r.toJSON();
    const related = opps.filter(o=>o.accountId===r.id);
    j.openOpps = related.filter(o=> !['Closed Won','Closed Lost'].includes(o.stage)).length;
    j.totalValue = related.reduce((s,o)=>s+Number(o.amount||0),0);
    return j;
  });
  res.json(out);
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

// Contacts
exports.listContacts = async (req,res)=>{
  const companyName = companyFilter(req);
  const rows = await CrmContact.findAll({ where:{ companyName }, order:[['created_at','DESC']] });
  res.json(rows);
};
exports.createContact = async (req,res)=>{
  const companyName = companyFilter(req);
  const { accountId, firstName, lastName, email, phone, title, ownerId, isPrimary } = req.body;
  if(!firstName || !lastName) return res.status(400).json({error:'firstName/lastName required'});
  const row = await CrmContact.create({ companyName, accountId: accountId||null, firstName, lastName, email, phone, title, ownerId: ownerId||req.user?.employeeId, isPrimary: !!isPrimary });
  res.status(201).json(row);
};
exports.updateContact = async (req,res)=>{
  const row = await CrmContact.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.update(req.body); res.json(row);
};
exports.deleteContact = async (req,res)=>{
  const row = await CrmContact.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.destroy(); res.json({success:true});
};

// Products
exports.listProducts = async (req,res)=>{
  const companyName = companyFilter(req);
  const rows = await CrmProduct.findAll({ where:{ companyName }, order:[['created_at','DESC']] });
  res.json(rows);
};
exports.createProduct = async (req,res)=>{
  const companyName = companyFilter(req);
  const { name, sku, category, price, cost } = req.body;
  if(!name) return res.status(400).json({error:'name required'});
  const row = await CrmProduct.create({ companyName, name, sku, category, price: price||0, cost: cost||0 });
  res.status(201).json(row);
};
exports.updateProduct = async (req,res)=>{
  const row = await CrmProduct.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.update(req.body); res.json(row);
};
exports.deleteProduct = async (req,res)=>{
  const row = await CrmProduct.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.destroy(); res.json({success:true});
};

// Opportunities
exports.listOpportunities = async (req,res)=>{
  const companyName = companyFilter(req);
  const where={ companyName };
  if(req.query.stage && req.query.stage!=='All') where.stage=req.query.stage;
  if(req.query.search){
    const q=`%${req.query.search}%`;
    where[Op.or]=[{title:{[Op.iLike]:q}}];
  }
  const rows = await CrmOpportunity.findAll({ where, order:[['created_at','DESC']] });
  const now=new Date();
  const out = rows.map(r=>{
    const j=r.toJSON();
    const entered = j.stageEnteredAt? new Date(j.stageEnteredAt): new Date(j.updatedAt||j.created_at);
    const daysInStage = Math.floor((now - entered)/86400000);
    j.daysInStage = daysInStage;
    j.isRotting = daysInStage>7 && !['Closed Won','Closed Lost'].includes(j.stage);
    j.weighted = Math.round(Number(j.amount||0) * Number(j.probability||0)/100);
    j.healthScore = j.isRotting? Math.max(0, (j.healthScore||75)-20) : j.healthScore||75;
    return j;
  });
  res.json(out);
};
exports.createOpportunity = async (req,res)=>{
  const companyName = companyFilter(req);
  const { title, accountId, amount, stage, probability, closeDate, assignedTo, competitors, forecastCategory } = req.body;
  if(!title) return res.status(400).json({error:'title required'});
  const row = await CrmOpportunity.create({ companyName, title, accountId: accountId||null, amount: amount||0, stage: stage||'Lead', probability: probability||20, closeDate: closeDate||null, assignedTo: assignedTo||req.user?.employeeId, createdBy: req.user?.employeeId, stageEnteredAt: new Date(), competitors, forecastCategory: forecastCategory||'Pipeline' });
  res.status(201).json(row);
};
exports.updateOpportunity = async (req,res)=>{
  const row = await CrmOpportunity.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  const prevStage=row.stage;
  await row.update(req.body);
  if(req.body.stage && req.body.stage!==prevStage){
    await row.update({ stageEnteredAt: new Date() });
  }
  // auto probability sync with stage if not explicitly set
  if(req.body.stage && !req.body.probability){
    const map={Lead:20, Qualified:40, Proposal:60, Negotiation:80, 'Closed Won':100, 'Closed Lost':0};
    if(map[req.body.stage]!==undefined) await row.update({ probability: map[req.body.stage] });
  }
  res.json(row);
};
exports.deleteOpportunity = async (req,res)=>{
  const row = await CrmOpportunity.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.destroy(); res.json({success:true});
};

// Quotes
exports.listQuotes = async (req,res)=>{
  const companyName = companyFilter(req);
  const rows = await CrmQuote.findAll({ where:{ companyName }, order:[['created_at','DESC']] });
  res.json(rows);
};
exports.createQuote = async (req,res)=>{
  const companyName = companyFilter(req);
  const { opportunityId, accountId, title, amount, discount, status, validUntil } = req.body;
  if(!title) return res.status(400).json({error:'title required'});
  const row = await CrmQuote.create({ companyName, opportunityId: opportunityId||null, accountId: accountId||null, title, amount: amount||0, discount: discount||0, status: status||'Draft', validUntil: validUntil||null, createdBy: req.user?.employeeId });
  res.status(201).json(row);
};
exports.updateQuote = async (req,res)=>{
  const row = await CrmQuote.findByPk(req.params.id);
  if(!row) return res.status(404).json({error:'Not found'});
  await row.update(req.body); res.json(row);
};
exports.deleteQuote = async (req,res)=>{
  const row = await CrmQuote.findByPk(req.params.id);
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

// Stats - advanced
exports.stats = async (req,res)=>{
  const companyName = companyFilter(req);
  const [leads, opps, acts, accounts, contacts, products] = await Promise.all([
    CrmLead.findAll({ where:{ companyName } }),
    CrmOpportunity.findAll({ where:{ companyName } }),
    CrmActivity.findAll({ where:{ companyName } }),
    CrmAccount.findAll({ where:{ companyName } }),
    CrmContact.findAll({ where:{ companyName } }),
    CrmProduct.findAll({ where:{ companyName } }),
  ]);
  const totalValue = opps.reduce((s,o)=> s+Number(o.amount||0),0);
  const weighted = opps.reduce((s,o)=> s+ Math.round(Number(o.amount||0)*Number(o.probability||0)/100),0);
  const won = opps.filter(o=>o.stage==='Closed Won');
  const lost = opps.filter(o=>o.stage==='Closed Lost');
  const funnel = ['Lead','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'].map(stage=> ({ stage, count: opps.filter(o=>o.stage===stage).length, value: opps.filter(o=>o.stage===stage).reduce((s,o)=>s+Number(o.amount||0),0), weighted: opps.filter(o=>o.stage===stage).reduce((s,o)=>s+ Math.round(Number(o.amount||0)*Number(o.probability||0)/100),0) }));
  const bySource = {};
  leads.forEach(l=>{ bySource[l.source||'Other']=(bySource[l.source||'Other']||0)+1; });
  const byStatus = {};
  leads.forEach(l=>{ byStatus[l.status||'New']=(byStatus[l.status||'New']||0)+1; });
  const byStage = {};
  opps.forEach(o=>{ byStage[o.stage]=(byStage[o.stage]||0)+1; });
  const velocity = opps.length? (opps.filter(o=> ['Closed Won','Closed Lost'].includes(o.stage)).length / Math.max(1, opps.length) * 100).toFixed(1): 0;
  const avgCycle = 22; // placeholder days
  const forecast = {
    pipeline: weighted,
    bestCase: totalValue,
    commit: opps.filter(o=>['Negotiation','Proposal'].includes(o.stage)).reduce((s,o)=> s+ Math.round(Number(o.amount||0)*Number(o.probability||0)/100),0),
    closed: won.reduce((s,o)=>s+Number(o.amount||0),0),
  };
  res.json({
    leads: { total: leads.length, byStatus, bySource, converted: leads.filter(l=>l.status==='Converted').length, hot: leads.filter(l=> (l.score||0)>75).length },
    opportunities: { total: opps.length, totalValue, weighted, won: won.length, lost: lost.length, funnel, byStage, avgDeal: opps.length? Math.round(totalValue/opps.length):0, velocity, avgCycle, forecast },
    activities: { total: acts.length, pending: acts.filter(a=>!a.done).length, overdue: acts.filter(a=> a.dueDate && !a.done && new Date(a.dueDate) < new Date()).length, completed: acts.filter(a=>a.done).length },
    accounts: { total: accounts.length },
    contacts: { total: contacts.length },
    products: { total: products.length },
  });
};
