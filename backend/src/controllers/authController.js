const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const logger = require('../config/logger');

// Function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, displayName, avatarUrl } = req.body;

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

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const newUser = new User({
      username,
      email,
      password,
      displayName,
      avatarUrl,
    });

    await newUser.save();

    const token = generateToken(newUser._id, newUser.role);

    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      avatarUrl: newUser.avatarUrl,
      role: newUser.role,
      bananaCount: newUser.bananaCount,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: userResponse,
    });
  } catch (error) {
    logger.error('Registration Error:', {
      message: error.message,
      stack: error.stack,
      details: error.errors || error.keyValue,
    });
    if (error.name === 'ValidationError' || error.code === 11000) {
      let errorMessage = 'Registration failed due to validation issues.';
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
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Basic Input Validation ---
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide email and password.' });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: 'Please provide a valid email address.' });
    }

    // --- Find User ---
    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- Verify Password ---
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- Check if Blocked ---
    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Your account is blocked. Please contact support.',
      });
    }

    // --- Generate JWT ---
    const token = generateToken(user._id, user.role);

    // --- Send Response ---
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      bananaCount: user.bananaCount,
    };

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: userResponse,
    });
  } catch (error) {
    logger.error('Login Error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error during login.' });
  }
};
