const User = require('../models/User');
const validator = require('validator');

// Helper function to format user response
const userToResponse = (user) => {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    bananaCount: user.bananaCount,
    isBlocked: user.isBlocked,
    isDeleted: user.isDeleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

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

// @desc    Update user details (by Admin)
// @route   PUT /api/users/:userId
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { username, email, displayName, avatarUrl, role } = req.body;

    const user = await User.findOne({ _id: userId, isDeleted: false });

    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found or has been deleted.' });
    }

    if (email) {
      if (!validator.isEmail(email)) {
        return res
          .status(400)
          .json({ message: 'Please provide a valid email address.' });
      }
      const existingUserByEmail = await User.findOne({
        email: email,
        _id: { $ne: userId },
      });
      if (existingUserByEmail) {
        return res
          .status(400)
          .json({ message: 'Email already in use by another account.' });
      }
      user.email = email;
    }

    if (username) {
      const existingUserByUsername = await User.findOne({
        username: username,
        _id: { $ne: userId },
      });
      if (existingUserByUsername) {
        return res
          .status(400)
          .json({ message: 'Username already taken by another account.' });
      }
      user.username = username;
    }

    if (role) {
      if (!['player', 'admin'].includes(role)) {
        return res.status(400).json({
          message: 'Invalid role specified. Must be "player" or "admin".',
        });
      }
      user.role = role;
    }

    if (displayName !== undefined) user.displayName = displayName;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    const updatedUser = await user.save();

    const userResponse = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      bananaCount: updatedUser.bananaCount,
      isBlocked: updatedUser.isBlocked,
      isDeleted: updatedUser.isDeleted,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.status(200).json({
      message: 'User updated successfully by admin!',
      user: userResponse,
    });
  } catch (error) {
    console.error('Update User Error:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    if (error.code === 11000) {
      let field = Object.keys(error.keyValue)[0];
      return res
        .status(400)
        .json({ message: `An account with that ${field} already exists.` });
    }
    res.status(500).json({ message: 'Server error while updating user.' });
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

// @desc    Soft delete a user (by Admin)
// @route   DELETE /api/users/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isDeleted) {
      return res
        .status(200)
        .json({ message: 'User was already marked as deleted.' });
    }

    user.isDeleted = true;

    await user.save();

    // --- Force logout active sessions for the deleted user ---
    const io = req.app.get('socketio');
    const activeUsersMap = req.app.get('activeUsers');
    const userIdToString = user._id.toString();

    if (io && activeUsersMap && activeUsersMap.has(userIdToString)) {
      const SocketsToDisconnect = activeUsersMap.get(userIdToString);
      SocketsToDisconnect.forEach((socketId) => {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.emit('force_logout', {
            message: 'Your account has been deleted.',
          });
          targetSocket.disconnect(true);
          console.log(
            `Force logout event sent to socket ${socketId} for user ${user.username}`
          );
        }
      });
    }

    res.status(200).json({ message: 'User soft deleted successfully.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    res.status(500).json({ message: 'Server error while deleting user.' });
  }
};

// @desc    Block a user (by Admin)
// @route   PUT /api/users/:userId/block
// @access  Private/Admin
exports.blockUser = async (req, res) => {
  try {
    const userIdToBlock = req.params.userId;

    const userToBlock = await User.findOne({
      _id: userIdToBlock,
      isDeleted: false,
    });

    if (!userToBlock) {
      return res
        .status(404)
        .json({ message: 'User not found or has been deleted.' });
    }

    // Prevent admins from being blocked
    if (userToBlock.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot be blocked.' });
    }

    if (userToBlock.isBlocked) {
      return res.status(200).json({
        message: 'User is already blocked.',
        user: userToResponse(userToBlock),
      });
    }

    userToBlock.isBlocked = true;
    const updatedUser = await userToBlock.save();

    // --- Force logout active sessions for the blocked user ---
    const io = req.app.get('socketio');
    const activeUsersMap = req.app.get('activeUsers');
    const userIdToString = updatedUser._id.toString();

    if (io && activeUsersMap && activeUsersMap.has(userIdToString)) {
      const SocketsToDisconnect = activeUsersMap.get(userIdToString);
      SocketsToDisconnect.forEach((socketId) => {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.emit('force_logout', {
            message: 'Your account has been blocked.',
          });
          targetSocket.disconnect(true);
          console.log(
            `Force logout event sent to socket ${socketId} for user ${updatedUser.username}`
          );
        }
      });
    }

    res.status(200).json({
      message: 'User blocked successfully.',
      user: userToResponse(updatedUser),
    });
  } catch (error) {
    console.error('Block User Error:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    res.status(500).json({ message: 'Server error while blocking user.' });
  }
};

// @desc    Unblock a user (by Admin)
// @route   PUT /api/users/:userId/unblock
// @access  Private/Admin
exports.unblockUser = async (req, res) => {
  try {
    const userIdToUnblock = req.params.userId;

    const userToUnblock = await User.findOne({
      _id: userIdToUnblock,
      isDeleted: false,
    });

    if (!userToUnblock) {
      return res
        .status(404)
        .json({ message: 'User not found or has been deleted.' });
    }

    if (!userToUnblock.isBlocked) {
      return res.status(200).json({
        message: 'User is already unblocked.',
        user: userToResponse(userToUnblock),
      });
    }

    userToUnblock.isBlocked = false;
    const updatedUser = await userToUnblock.save();

    res.status(200).json({
      message: 'User unblocked successfully.',
      user: userToResponse(updatedUser),
    });
  } catch (error) {
    console.error('Unblock User Error:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    res.status(500).json({ message: 'Server error while unblocking user.' });
  }
};
