const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/', taskController.getTasks);
router.get('/statuses', taskController.getStatusOptions);
router.get('/priorities', taskController.getPriorityOptions);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTask);
router.get('/:id/activities', taskController.getTaskActivities);
router.get('/:id/members', taskController.getTaskMembers);
router.post('/:id/members', taskController.addTaskMember);
router.delete('/members/:memberId', taskController.removeTaskMember);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/status', taskController.updateTaskStatus);
router.post('/:id/checklist', taskController.addChecklistItem);
router.put('/checklist/:itemId', taskController.updateChecklistItem);
router.patch('/checklist/:itemId/toggle', taskController.toggleChecklistItem);
router.delete('/checklist/:itemId', taskController.deleteChecklistItem);

module.exports = router;