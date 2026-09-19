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

router.get('/contacts', verifyToken, c.listContacts);
router.post('/contacts', verifyToken, c.createContact);
router.put('/contacts/:id', verifyToken, c.updateContact);
router.delete('/contacts/:id', verifyToken, c.deleteContact);

router.get('/products', verifyToken, c.listProducts);
router.post('/products', verifyToken, c.createProduct);
router.put('/products/:id', verifyToken, c.updateProduct);
router.delete('/products/:id', verifyToken, c.deleteProduct);

router.get('/opportunities', verifyToken, c.listOpportunities);
router.post('/opportunities', verifyToken, c.createOpportunity);
router.put('/opportunities/:id', verifyToken, c.updateOpportunity);
router.delete('/opportunities/:id', verifyToken, c.deleteOpportunity);

router.get('/quotes', verifyToken, c.listQuotes);
router.post('/quotes', verifyToken, c.createQuote);
router.put('/quotes/:id', verifyToken, c.updateQuote);
router.delete('/quotes/:id', verifyToken, c.deleteQuote);

router.get('/activities', verifyToken, c.listActivities);
router.post('/activities', verifyToken, c.createActivity);
router.put('/activities/:id', verifyToken, c.updateActivity);
router.delete('/activities/:id', verifyToken, c.deleteActivity);

module.exports = router;
