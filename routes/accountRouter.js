const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/uploadExcel");

// Account management routes
router.post("/import", upload.single("file"), accountController.importManyUser);
router.post(
  "/company-admin",
  authenticateToken,
  accountController.createCompanyAdmin
);
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
 * /api/accounts/company-admin:
 *   post:
 *     summary: Create a company admin account
 *     description: >
 *       Create a new account with company admin privileges.
 *       The account will automatically have:
 *       - role = "company"
 *       - isCompany = true
 *       - company_id set from request body
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - phone
 *               - password
 *               - company_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: "company_admin_01"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@company.com"
 *               phone:
 *                 type: string
 *                 example: "+84901234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123"
 *               company_id:
 *                 type: string
 *                 description: Company ID (required, must exist)
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Company admin account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company admin account created successfully"
 *                 account:
 *                   $ref: '#/components/schemas/Account'
 *       400:
 *         description: Bad request (missing fields, invalid format, duplicate, or company_id not provided)
 *       404:
 *         description: Company not found
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
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
 *                 isCompany:
 *                   type: boolean
 *                 company_id:
 *                   oneOf:
 *                     - type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     - type: "null"
 *                   description: "Company reference (populated with company details)"
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
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
 *                 enum: [driver, admin, staff, company]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               isCompany:
 *                 type: boolean
 *                 description: Whether this account represents a company
 *               company_id:
 *                 type: string
 *                 nullable: true
 *                 description: Company ID (optional, defaults to null)
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Updated account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
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
 *       **Excel Structure:**
 *       - Row 1: Group headers (User, Car) - will be skipped
 *       - Row 2: Column names (username, email, phone, etc.)
 *       - Row 3+: Data rows
 *
 *       **Required Excel columns (User):**
 *       - username (string, required)
 *       - email (string, required)
 *       - phone (string, required)
 *       - password (string, optional - default: "123456")
 *       - role (string, optional - default: "driver", values: driver, admin, staff, company)
 *       - status (string, optional - default: "active", values: active, inactive)
 *       - isCompany will be automatically set to TRUE for all imported accounts
 *
 *
 *       **Required Excel columns (Vehicle):**
 *       - plate_number (string, required for creating vehicle)
 *       - model (string, optional)
 *       - batteryCapacity (number, optional)
 *
 *
 *       **Excel file example:**
 *       Row 1: | User | | | | | | Car | | |
 *       Row 2: | username | email | phone | password | role | status | plate_number | model | batteryCapacity |
 *       Row 3: | kha4 | kha4@gmail.com | 901234569 | 123456 | admin | active | 1111-111111 | v8 | 1000 |
 *       Row 4: | kha5 | kha5@gmail.com | 912345680 | 123456 | driver | active | 1111-111112 | v8 | 1000 |
 *       Row 5: | company1 | company1@gmail.com | 987654323 | 123456 | company | active | 1111-111113 | v8 | 1000 |
 *
 *       **Note:**
 *       - All imported accounts will have isCompany=true automatically
 *       - If company_id is provided, it will be set for all imported accounts (validated before import)
 *       - Vehicle will only be created if plate_number is provided in Excel.
 *       - If subscription_id is provided, a VehicleSubscription will be automatically created for each vehicle with status='active' and payment_status='paid'.
 *       - The subscription period is calculated based on the billing_cycle of the subscription plan.
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
 *                 description: Company ID to assign to all created accounts and vehicles (optional, validated if provided)
 *                 example: "507f1f77bcf86cd799439011"
 *               subscription_id:
 *                 type: string
 *                 description: Subscription Plan ID to assign to all created vehicles (optional)
 *                 example: "507f1f77bcf86cd799439012"
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
 *                   example: Imported 3 users, 3 vehicles, and 3 subscriptions successfully
 *                 usersCount:
 *                   type: integer
 *                   example: 3
 *                 vehiclesCount:
 *                   type: integer
 *                   example: 3
 *                 subscriptionsCount:
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
 *                       isCompany:
 *                         type: boolean
 *                       company_id:
 *                         oneOf:
 *                           - type: string
 *                           - type: "null"
 *                         description: "Company reference (populated with company details if available)"
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
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       vehicle_id:
 *                         type: string
 *                       subscription_id:
 *                         type: string
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         example: active
 *                       auto_renew:
 *                         type: boolean
 *                       payment_status:
 *                         type: string
 *                         example: paid
 *       400:
 *         description: Invalid or missing file, or subscription plan not active
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Server error
 */
