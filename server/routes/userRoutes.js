const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');
const { verifyToken } = require("../middleware/authMiddleware");

router.post('/users/register', userController.registerUser);
router.post('/users/registers', upload.single('photo'), userController.registerUsers);
router.post('/login', userController.loginUser);
router.patch('/users/update', verifyToken, userController.updateUser);
router.patch('/users/update-photo', verifyToken, upload.single('photo'), userController.updateUserPhoto);
router.get('/users/by-email', verifyToken, userController.getUserByEmail);
router.get('/users/unassigned', verifyToken, userController.getUnassignedUsers);
router.get('/users', verifyToken, userController.getUsers);
router.get('/users/employees', verifyToken, userController.getUsersList);
router.get('/users-by-month', verifyToken, userController.getUsersByMonth);
router.get('/users-by-location', verifyToken, userController.getUsersByLocation);
router.get('/users-by-genders', verifyToken, userController.getUsersByGenders);
router.get('/users-by-departments', verifyToken, userController.getUsersByDepartments);
router.put('/users/:id', verifyToken, upload.single('photo'), userController.updateUserDetails);
router.patch('/users/:id', verifyToken, userController.toggleUserExists);
router.get('/users/next-employee-id', verifyToken, userController.getNextEmployeeId);

module.exports = router;