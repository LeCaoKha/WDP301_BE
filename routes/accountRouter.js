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
 *     summary: Import multiple accounts and vehicles from Excel file
 *     description: >
 *       Upload an Excel file (.xlsx or .xls) containing multiple users to create them in bulk.
 *       Also automatically creates vehicles for each user based on the data in Excel.
 *
 *
 *       **Required Excel columns (User):**
 *       - username (string, required)
 *       - email (string, required)
 *       - phone (string, required)
 *       - password (string, optional - default: "123456")
 *       - role (string, optional - default: "user", values: admin, driver, user)
 *       - status (string, optional - default: "active", values: active, inactive)
 *
 *
 *       **Required Excel columns (Vehicle):**
 *       - plate_number (string, required for creating vehicle)
 *       - model (string, optional)
 *       - batteryCapacity (number, optional)
 *
 *
 *       **Excel file example:**
 *       | username | email | phone | password | role | status | plate_number | model | batteryCapacity |
 *       |----------|--------|--------|----------|------|--------|--------------|-------|-----------------|
 *       | kha 1 | kha1@gmail.com | 901234568 | 123456 | admin | active | 1111-111111 | v8 | 1000 |
 *       | kha 2 | kha2@gmail.com | 912345679 | 123456 | driver | active | 1111-111112 | v8 | 1000 |
 *       | kha 3 | kha3@gmail.com | 987654322 | 123456 | driver | inactive | 1111-111113 | v8 | 1000 |
 *
 *
 *       **Note:** Vehicle will only be created if plate_number is provided in Excel.
 *     tags: [Account]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .xls) containing account and vehicle data
 *               company_id:
 *                 type: string
 *                 description: Company ID to assign to all created vehicles (optional)
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Successfully imported accounts and vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Imported 3 users and 3 vehicles successfully
 *                 usersCount:
 *                   type: integer
 *                   example: 3
 *                 vehiclesCount:
 *                   type: integer
 *                   example: 3
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       role:
 *                         type: string
 *                       status:
 *                         type: string
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       company_id:
 *                         type: string
 *                       plate_number:
 *                         type: string
 *                       model:
 *                         type: string
 *                       batteryCapacity:
 *                         type: number
 *       400:
 *         description: Invalid or missing file
 *       500:
 *         description: Server error
 */
