const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { authenticateToken } = require("../middleware/auth");

// Company CRUD routes (all require authentication)
router.post("/", authenticateToken, companyController.createCompany);
router.get("/", authenticateToken, companyController.getAllCompanies);

// Company-specific routes (get my company's data) - Must be before /:id route
router.get(
  "/my/drivers",
  authenticateToken,
  companyController.getMyCompanyDrivers
);
router.get(
  "/my/vehicles",
  authenticateToken,
  companyController.getMyCompanyVehicles
);
router.get(
  "/my/payments",
  authenticateToken,
  companyController.getMyCompanyPayments
);

// Company CRUD routes with ID (must be after /my routes)
router.get("/:id", authenticateToken, companyController.getCompanyById);
router.put("/:id", authenticateToken, companyController.updateCompanyById);
router.delete("/:id", authenticateToken, companyController.deleteCompanyById);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Company management
 */
/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   contact_email:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *   post:
 *     summary: Create a company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - contact_email
 *             properties:
 *               name:
 *                 type: string
 *                 description: Company name
 *                 maxLength: 100
 *               address:
 *                 type: string
 *                 description: Company address
 *                 maxLength: 200
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Company contact email
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 contact_email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Email already exists or validation error
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by id
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 contact_email:
 *                   type: string
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
 *         description: Company not found
 *   put:
 *     summary: Update company by id
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Company name
 *                 maxLength: 100
 *               address:
 *                 type: string
 *                 description: Company address
 *                 maxLength: 200
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Company contact email
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 contact_email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Email already in use or validation error
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Company not found
 *   delete:
 *     summary: Delete company by id
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company deleted successfully"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Company not found
 */
/**
 * @swagger
 * /api/companies/my/drivers:
 *   get:
 *     summary: Get all drivers of my company
 *     description: Get all drivers that belong to the company of the current user. Only returns drivers with role="driver" and matching company_id. Does not return drivers from other companies or drivers without a company.
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of drivers in the company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 drivers:
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
 *                       status:
 *                         type: string
 *                         enum: [active, inactive]
 *                       role:
 *                         type: string
 *                         enum: [driver]
 *                       company_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           contact_email:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token, or user is not associated with any company
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/companies/my/vehicles:
 *   get:
 *     summary: Get all vehicles of my company
 *     description: Get all vehicles that belong to the company of the current user. Only returns vehicles with matching company_id. Does not return vehicles from other companies or vehicles without a company.
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of vehicles in the company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                       company_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           contact_email:
 *                             type: string
 *                       plate_number:
 *                         type: string
 *                       model:
 *                         type: string
 *                       batteryCapacity:
 *                         type: number
 *                       vehicle_subscription_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           subscription_id:
 *                             type: object
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           auto_renew:
 *                             type: boolean
 *                           payment_status:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token, or user is not associated with any company
 *       404:
 *         description: Account not found
 */
/**
 * @swagger
 * /api/companies/my/payments:
 *   get:
 *     summary: Get all payments of my company
 *     description: Get all payments made by drivers that belong to the company of the current user. Returns payments from all drivers in the company.
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subscription, charging, base_fee]
 *         description: Filter payments by type (optional)
 *     responses:
 *       200:
 *         description: List of payments from company drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       madeBy:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           role:
 *                             type: string
 *                           company_id:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               address:
 *                                 type: string
 *                               contact_email:
 *                                 type: string
 *                       type:
 *                         type: string
 *                         enum: [subscription, charging, base_fee]
 *                       invoice_ids:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             total_amount:
 *                               type: number
 *                             payment_status:
 *                               type: string
 *                             station_name:
 *                               type: string
 *                             vehicle_plate_number:
 *                               type: string
 *                             start_time:
 *                               type: string
 *                             end_time:
 *                               type: string
 *                             charging_duration_formatted:
 *                               type: string
 *                             energy_delivered_kwh:
 *                               type: number
 *                       vnp_TxnRef:
 *                         type: string
 *                       vnp_Amount:
 *                         type: number
 *                       vnp_OrderInfo:
 *                         type: string
 *                       vnp_TransactionNo:
 *                         type: string
 *                       vnp_BankCode:
 *                         type: string
 *                       vnp_CardType:
 *                         type: string
 *                       vnp_PayDate:
 *                         type: string
 *                       vnp_ResponseCode:
 *                         type: string
 *                       vnp_TransactionStatus:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token, or user is not associated with any company
 *       404:
 *         description: Account not found
 */
