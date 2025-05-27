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
module.exports = router;
