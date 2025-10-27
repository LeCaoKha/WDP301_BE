const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/uploadExcel");

// Account management routes
router.post("/import", upload.single("file"), accountController.importManyUser);
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account detail
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Account not found
 *   put:
 *     summary: Update account by id
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/accounts/{id}/ban:
 *   patch:
 *     summary: Ban account by id (set status inactive)
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banned account
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/accounts/{id}/unban:
 *   patch:
 *     summary: Unban account by id (set status active)
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unbanned account
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/accounts/import:
 *   post:
 *     summary: Import multiple accounts from Excel file
 *     description: >
 *       Upload an Excel file (.xlsx or .xls) containing multiple users to create them in bulk.
 *
 *       **Excel columns example:**
 *       | username | email | phone | password | role | status |
 *       |-----------|--------|--------|-----------|--------|---------|
 *       | user1 | user1@gmail.com | 0901234567 | 123456 | user | active |
 *       | user2 | user2@gmail.com | 0909999999 | 654321 | admin | inactive |
 *     tags: [Account]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .xls) containing account data
 *     responses:
 *       201:
 *         description: Successfully imported accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Imported 5 users successfully
 *                 count:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Invalid or missing file
 *       500:
 *         description: Server error
 */
