const User = require('../models/User');
const validator = require('validator');

// @desc    Create a new user (by Admin)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, displayName, avatarUrl, role } =
      req.body;

    // --- Basic Input Validation ---
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide username, email, and password.' });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: 'Please provide a valid email address.' });
    }

    if (role && !['player', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role specified. Must be "player" or "admin".',
      });
    }

    // --- Check for existing user ---
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // --- Create new user ---
    const newUser = new User({
      username,
      email,
      password,
      displayName,
      avatarUrl,
      role: role || 'player',
    });

    await newUser.save();

    // --- Send Response ---
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      avatarUrl: newUser.avatarUrl,
      role: newUser.role,
      bananaCount: newUser.bananaCount,
      isBlocked: newUser.isBlocked,
      isDeleted: newUser.isDeleted,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.status(201).json({
      message: 'User created successfully by admin!',
      user: userResponse,
    });
  } catch (error) {
    console.error('Create User Error:', error);
    if (error.name === 'ValidationError' || error.code === 11000) {
      let errorMessage = 'User creation failed due to validation issues.';
      if (error.code === 11000) {
        if (error.keyValue && error.keyValue.email) {
          errorMessage = 'Email already in use.';
        } else if (error.keyValue && error.keyValue.username) {
          errorMessage = 'Username already taken.';
        }
      } else if (error.errors) {
        const messages = Object.values(error.errors).map((val) => val.message);
        errorMessage = `Validation Error: ${messages.join(', ')}`;
      }
      return res.status(400).json({
        message: errorMessage,
        details: error.errors || error.keyValue,
      });
    }
    res.status(500).json({ message: 'Server error during user creation.' });
  }
};

// @desc    Get all users (by Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).select('-password');

    res.status(200).json({
      message: 'Users retrieved successfully!',
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Server error while retrieving users.' });
  }
};

// @desc    Get user by ID (by Admin)
// @route   GET /api/users/:userId
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .where({ isDeleted: false })
      .select('-password');

    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found or has been deleted.' });
    }

    res.status(200).json({
      message: 'User details retrieved successfully!',
      user: user,
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    res
      .status(500)
      .json({ message: 'Server error while retrieving user details.' });
  }
};
