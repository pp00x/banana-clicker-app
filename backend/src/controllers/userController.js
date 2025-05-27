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
