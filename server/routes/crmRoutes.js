const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const c = require('../controllers/crmController');

router.get('/stats', verifyToken, c.stats);

router.get('/leads', verifyToken, c.listLeads);
router.post('/leads', verifyToken, c.createLead);
router.put('/leads/:id', verifyToken, c.updateLead);
router.delete('/leads/:id', verifyToken, c.deleteLead);
router.post('/leads/:id/convert', verifyToken, c.convertLead);

router.get('/accounts', verifyToken, c.listAccounts);
router.post('/accounts', verifyToken, c.createAccount);
router.put('/accounts/:id', verifyToken, c.updateAccount);
router.delete('/accounts/:id', verifyToken, c.deleteAccount);

router.get('/opportunities', verifyToken, c.listOpportunities);
router.post('/opportunities', verifyToken, c.createOpportunity);
router.put('/opportunities/:id', verifyToken, c.updateOpportunity);
router.delete('/opportunities/:id', verifyToken, c.deleteOpportunity);

router.get('/activities', verifyToken, c.listActivities);
router.post('/activities', verifyToken, c.createActivity);
router.put('/activities/:id', verifyToken, c.updateActivity);
router.delete('/activities/:id', verifyToken, c.deleteActivity);

module.exports = router;
