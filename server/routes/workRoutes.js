const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const workController = require('../controllers/workController');

router.get('/', verifyToken, workController.getWorkGroups);
router.post('/', verifyToken, workController.createWorkGroup);
router.put('/:id', verifyToken, workController.updateWorkGroup);

module.exports = router;