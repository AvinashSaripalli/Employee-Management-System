const { CrmLead, CrmAccount, CrmOpportunity, CrmActivity, User } = require('../models');
const { DEFAULT_COMPANY } = require('./companyMembership');

const COMPANY = DEFAULT_COMPANY || 'KN Advisors';

const exampleLeads = [
  { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.kumar@infosys.com', phone: '9876543210', accountName: 'Infosys Ltd', source: 'Website', status: 'New', score: 82, value: 12000, notes: 'Interested in HRMS implementation for 500 employees.' },
  { firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@tcs.com', phone: '9876543211', accountName: 'Tata Consultancy', source: 'Referral', status: 'Qualified', score: 91, value: 45000, notes: 'Warm referral from existing client. Budget approved.' },
  { firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@wipro.com', phone: '9876543212', accountName: 'Wipro Enterprises', source: 'LinkedIn', status: 'Contacted', score: 68, value: 18000, notes: 'LinkedIn outreach, wants demo next week.' },
  { firstName: 'Sneha', lastName: 'Reddy', email: 'sneha.reddy@techmahindra.com', phone: '9876543213', accountName: 'Tech Mahindra', source: 'Email', status: 'New', score: 74, value: 25000, notes: 'Downloaded whitepaper on payroll automation.' },
  { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@hcltech.com', phone: '9876543214', accountName: 'HCL Tech', source: 'Cold Call', status: 'Qualified', score: 88, value: 60000, notes: 'Decision maker, 2nd call completed.' },
  { firstName: 'Ananya', lastName: 'Gupta', email: 'ananya.gupta@ltimindtree.com', phone: '9876543215', accountName: 'LTIMindtree', source: 'Event', status: 'Contacted', score: 55, value: 9000, notes: 'Met at HR Tech Expo, Hyderabad.' },
  { firstName: 'Rohan', lastName: 'Mehta', email: 'rohan.mehta@cyient.com', phone: '9876543216', accountName: 'Cyient Ltd', source: 'Website', status: 'New', score: 63, value: 15000, notes: 'Requested pricing for attendance module.' },
  { firstName: 'Kavya', lastName: 'Nair', email: 'kavya.nair@mphasis.com', phone: '9876543217', accountName: 'Mphasis', source: 'Referral', status: 'Lost', score: 40, value: 7000, notes: 'Went with competitor, keep nurturing.' },
];

const exampleAccounts = [
  { name: 'Infosys Ltd', industry: 'Information Technology', size: '1000+', website: 'https://infosys.com', city: 'Bengaluru', ownerId: null },
  { name: 'Tata Consultancy Services', industry: 'Information Technology', size: '1000+', website: 'https://tcs.com', city: 'Mumbai', ownerId: null },
  { name: 'Wipro Enterprises', industry: 'Information Technology', size: '500-1000', website: 'https://wipro.com', city: 'Hyderabad', ownerId: null },
  { name: 'Tech Mahindra', industry: 'Telecom', size: '500-1000', website: 'https://techmahindra.com', city: 'Pune', ownerId: null },
  { name: 'HCL Technologies', industry: 'Information Technology', size: '1000+', website: 'https://hcltech.com', city: 'Noida', ownerId: null },
];

const exampleOpportunities = [
  { title: 'Infosys - HRMS Enterprise Rollout', amount: 120000, stage: 'Negotiation', probability: 80, closeDate: addDays(14), accountName: 'Infosys Ltd' },
  { title: 'TCS - Payroll + Compliance Suite', amount: 185000, stage: 'Proposal', probability: 60, closeDate: addDays(21), accountName: 'Tata Consultancy Services' },
  { title: 'Wipro - Attendance & Leave Automation', amount: 45000, stage: 'Qualified', probability: 40, closeDate: addDays(30), accountName: 'Wipro Enterprises' },
  { title: 'Tech Mahindra - Global HR Upgrade', amount: 95000, stage: 'Lead', probability: 20, closeDate: addDays(45), accountName: 'Tech Mahindra' },
  { title: 'HCL - Workforce Analytics', amount: 210000, stage: 'Closed Won', probability: 100, closeDate: addDays(-5), accountName: 'HCL Technologies' },
  { title: 'Cyient - Starter Package', amount: 28000, stage: 'Closed Lost', probability: 0, closeDate: addDays(-12), accountName: 'Cyient Ltd' },
  { title: 'LTIMindtree - Performance Module', amount: 67000, stage: 'Proposal', probability: 60, closeDate: addDays(18), accountName: 'LTIMindtree' },
];

const exampleActivities = [
  { type: 'Call', subject: 'Discovery call with Infosys', description: 'Understand pain points on leave approvals & roster', relatedType: 'Lead', dueDate: addDays(1) },
  { type: 'Meeting', subject: 'Demo for TCS - Payroll', description: 'Show tax, compliance, and reports', relatedType: 'Opportunity', dueDate: addDays(2) },
  { type: 'Email', subject: 'Send proposal to Wipro', description: 'Include SOW, timeline, commercial', relatedType: 'Opportunity', dueDate: addDays(3) },
  { type: 'Task', subject: 'Prepare SOW for Tech Mahindra', description: 'Draft scope for global rollout', relatedType: 'Account', dueDate: addDays(-1) },
  { type: 'Note', subject: 'Lost reason - Mphasis', description: 'Customer chose Darwinbox due to lower cost. Revisit in Q3.', relatedType: 'Lead', dueDate: addDays(0) },
  { type: 'Meeting', subject: 'Negotiation - Infosys commercials', description: 'Final pricing and payment terms', relatedType: 'Opportunity', dueDate: addDays(5) },
  { type: 'Call', subject: 'Follow-up with Cyient', description: 'Check feedback on starter package demo', relatedType: 'Lead', dueDate: addDays(-2) },
  { type: 'Email', subject: 'Welcome email to new leads', description: 'Send case studies and 2-min video', relatedType: 'Lead', dueDate: addDays(0) },
];

function addDays(n){
  const d=new Date();
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}

async function seedCrm(companyName = COMPANY){
  try{
    const leadCount = await CrmLead.count({ where: { companyName } });
    const accCount = await CrmAccount.count({ where: { companyName } });
    const oppCount = await CrmOpportunity.count({ where: { companyName } });
    const actCount = await CrmActivity.count({ where: { companyName } });

    if(leadCount>3 && accCount>2 && oppCount>3){
      console.log(`[CRM Seed] Skip — already has data (${leadCount} leads, ${accCount} accounts, ${oppCount} opps) for ${companyName}`);
      return;
    }

    // pick owner from first admin/manager user
    let ownerId = null;
    try{
      const owner = await User.findOne({ where: { companyName, exists:1 }, order:[['id','ASC']] });
      ownerId = owner?.employeeId || null;
    }catch{}

    console.log(`[CRM Seed] Seeding example data for ${companyName}...`);

    // Accounts first (needed for opp accountId linking)
    const createdAccounts=[];
    if(accCount===0){
      for(const a of exampleAccounts){
        const row = await CrmAccount.create({ ...a, companyName, ownerId: a.ownerId || ownerId });
        createdAccounts.push(row);
      }
      console.log(`[CRM Seed] Created ${createdAccounts.length} accounts`);
    } else {
      const existing = await CrmAccount.findAll({ where:{ companyName } });
      createdAccounts.push(...existing);
    }

    const accountByName = Object.fromEntries(createdAccounts.map(a=>[a.name, a.id]));

    // Leads
    if(leadCount===0){
      for(const l of exampleLeads){
        await CrmLead.create({ ...l, companyName, assignedTo: ownerId, createdBy: ownerId });
      }
      console.log(`[CRM Seed] Created ${exampleLeads.length} leads`);
    }

    // Opportunities
    if(oppCount===0){
      for(const o of exampleOpportunities){
        const accountId = accountByName[o.accountName] || null;
        const { accountName, ...rest } = o;
        await CrmOpportunity.create({ ...rest, companyName, accountId, assignedTo: ownerId, createdBy: ownerId });
      }
      console.log(`[CRM Seed] Created ${exampleOpportunities.length} opportunities`);
    }

    // Activities
    if(actCount===0){
      for(const act of exampleActivities){
        await CrmActivity.create({ ...act, companyName, createdBy: ownerId });
      }
      console.log(`[CRM Seed] Created ${exampleActivities.length} activities`);
    }

    console.log(`[CRM Seed] Done for ${companyName}`);
  }catch(e){
    console.error('[CRM Seed] Failed:', e.message);
  }
}

module.exports = { seedCrm, COMPANY };

// allow direct run: node utils/seedCrm.js
if(require.main===module){
  (async()=>{
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    await require('../models').CrmLead.sync();
    await require('../models').CrmAccount.sync();
    await require('../models').CrmOpportunity.sync();
    await require('../models').CrmActivity.sync();
    await seedCrm(process.argv[2]|| COMPANY);
    await sequelize.close();
    process.exit(0);
  })();
}
