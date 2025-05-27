const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// @route   POST /api/users
// @desc    Admin creates a new user
// @access  Private/Admin
router.post('/', protect, isAdmin, userController.createUser);

// @route   GET /api/users
// @desc    Admin gets all users
// @access  Private/Admin
router.get('/', protect, isAdmin, userController.getUsers);
// @route   GET /api/users/:userId
// @desc    Admin gets user by ID
// @access  Private/Admin
router.get('/:userId', protect, isAdmin, userController.getUserById);
// @route   PUT /api/users/:userId
// @desc    Admin updates user details
// @access  Private/Admin
router.put('/:userId', protect, isAdmin, userController.updateUser);
module.exports = router;
