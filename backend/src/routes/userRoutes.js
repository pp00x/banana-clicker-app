const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// @route   POST /api/users
// @desc    Admin creates a new user
// @access  Private/Admin
router.post('/', protect, isAdmin, userController.createUser);

module.exports = router;
