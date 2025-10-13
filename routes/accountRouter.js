const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { authenticateToken } = require("../middleware/auth");

// Account management routes
router.get("/", authenticateToken, accountController.getAllAccounts);
router.get("/me", authenticateToken, accountController.getMyAccount);
router.get("/:id", authenticateToken, accountController.getAccountById);
router.put("/:id", authenticateToken, accountController.updateAccountById);
router.patch("/:id/ban", authenticateToken, accountController.banAccountById);
router.patch(
  "/:id/unban",
  authenticateToken,
  accountController.unbanAccountById
);
module.exports = router;

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/accounts/me:
 *   get:
 *     summary: Get my account (current user's account)
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's account details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [driver, admin, company]
 *                 status:
 *                   type: string
 *                   enum: [active, inactive]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by id
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account detail
 *       404:
 *         description: Account not found
 *   put:
 *     summary: Update account by id
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [driver, admin, staff]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Updated account
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/accounts/{id}/ban:
 *   patch:
 *     summary: Ban account by id (set status inactive)
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banned account
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/accounts/{id}/unban:
 *   patch:
 *     summary: Unban account by id (set status active)
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unbanned account
 *       404:
 *         description: Account not found
 */
