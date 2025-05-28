const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Admin creates a new user
 *     tags: [Users]
 *     description: Allows an authenticated admin to create a new user (player or admin).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: newplayer_admin_created
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newplayer.admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongPasswordForNewUser
 *               displayName:
 *                 type: string
 *                 example: New Player (Admin)
 *               avatarUrl:
 *                 type: string
 *                 format: url
 *                 example: http://example.com/avatar_admin.png
 *               role:
 *                 type: string
 *                 enum: [player, admin]
 *                 default: player
 *                 example: player
 *     responses:
 *       201:
 *         description: User created successfully by admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully by admin!
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid input (e.g., missing fields, email/username taken, invalid role)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please provide username, email, and password.
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (user is not an admin)
 *       500:
 *         description: Server error
 */
router.post('/', protect, isAdmin, userController.createUser);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Admin gets all non-deleted users
 *     tags: [Users]
 *     description: Allows an authenticated admin to retrieve a list of all users who are not soft-deleted.
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully!
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (user is not an admin)
 *       500:
 *         description: Server error
 */
router.get('/', protect, isAdmin, userController.getUsers);

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     summary: Admin gets a specific user by their ID
 *     tags: [Users]
 *     description: Allows an authenticated admin to retrieve details for a specific non-deleted user.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user to retrieve.
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8a5a4c8d9c0a
 *     responses:
 *       200:
 *         description: Successfully retrieved user details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User details retrieved successfully!
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user ID format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid user ID format.
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (user is not an admin)
 *       404:
 *         description: User not found or has been deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found or has been deleted.
 *       500:
 *         description: Server error
 */
router.get('/:userId', protect, isAdmin, userController.getUserById);

/**
 * @openapi
 * /users/{userId}:
 *   put:
 *     summary: Admin updates user details
 *     tags: [Users]
 *     description: Allows an authenticated admin to update details for a specific user. Password cannot be updated via this endpoint.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user to update.
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8a5a4c8d9c0a
 *     requestBody:
 *       description: Fields to update for the user. All fields are optional.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: updated_username
 *               email:
 *                 type: string
 *                 format: email
 *                 example: updated_user@example.com
 *               displayName:
 *                 type: string
 *                 example: Updated Display Name
 *               avatarUrl:
 *                 type: string
 *                 format: url
 *                 example: http://example.com/updated_avatar.png
 *               role:
 *                 type: string
 *                 enum: [player, admin]
 *                 example: player
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully by admin!
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid input (e.g., email/username taken, invalid role, invalid userId format).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already in use by another account.
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (user is not an admin)
 *       404:
 *         description: User not found or has been deleted.
 *       500:
 *         description: Server error
 */
router.put('/:userId', protect, isAdmin, userController.updateUser);

/**
 * @openapi
 * /users/{userId}:
 *   delete:
 *     summary: Admin soft deletes a user
 *     tags: [Users]
 *     description: Allows an authenticated admin to soft delete a user. Admins cannot delete themselves or other admins.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user to soft delete.
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8a5a4c8d9c0a
 *     responses:
 *       200:
 *         description: User soft deleted successfully or was already deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User soft deleted successfully.
 *       400:
 *         description: Invalid user ID format.
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (user is not an admin, or attempting to delete self/another admin).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admins cannot delete their own account.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error
 */
router.delete('/:userId', protect, isAdmin, userController.deleteUser);

/**
 * @openapi
 * /users/{userId}/block:
 *   put:
 *     summary: Admin blocks a user
 *     tags: [Users]
 *     description: Allows an authenticated admin to block a user. Admins cannot be blocked.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user to block.
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8a5a4c8d9c0a
 *     responses:
 *       200:
 *         description: User blocked successfully or was already blocked.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User blocked successfully.
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user ID format.
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (user is not an admin, or attempting to block an admin).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admins cannot be blocked.
 *       404:
 *         description: User not found or has been deleted.
 *       500:
 *         description: Server error
 */
router.put('/:userId/block', protect, isAdmin, userController.blockUser);

/**
 * @openapi
 * /users/{userId}/unblock:
 *   put:
 *     summary: Admin unblocks a user
 *     tags: [Users]
 *     description: Allows an authenticated admin to unblock a user.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user to unblock.
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8a5a4c8d9c0a
 *     responses:
 *       200:
 *         description: User unblocked successfully or was already unblocked.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User unblocked successfully.
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user ID format.
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (user is not an admin).
 *       404:
 *         description: User not found or has been deleted.
 *       500:
 *         description: Server error
 */
router.put('/:userId/unblock', protect, isAdmin, userController.unblockUser);

module.exports = router;
