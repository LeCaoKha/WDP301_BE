const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");

// Account management routes
router.get("/", accountController.getAllAccounts);
router.get("/:id", accountController.getAccountById);
router.put("/:id", accountController.updateAccountById);
router.patch("/:id/ban", accountController.banAccountById);
router.patch("/:id/unban", accountController.unbanAccountById);
module.exports = router;

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: List of accounts
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
