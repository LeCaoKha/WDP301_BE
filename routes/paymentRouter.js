const express = require("express");
const {
  payForSubscription,
  payForSubscriptionReturn,
  payForCharging,
  payForChargingReturn,
  payForBaseFee,
  payForBaseFeeReturn,
  paymentTest,
  paymentTestReturn,
  getAllPayments,
  getPaymentById,
  getPaymentsByUserId,
  getMyPayments,
} = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Payment processing routes
router.post("/payment-test", paymentTest);
router.get("/payment-test-return/:txnRef", paymentTestReturn);
router.post("/pay-for-subscription", payForSubscription);
router.get("/pay-for-subscription-return/:txnRef", payForSubscriptionReturn);
router.post("/pay-for-charging", payForCharging);
router.get("/pay-for-charging-return/:txnRef", payForChargingReturn);
router.post("/pay-for-base-fee", payForBaseFee);
router.get("/pay-for-base-fee-return/:txnRef", payForBaseFeeReturn);

// Payment query routes (order matters - specific routes before dynamic routes)
router.get("/", authenticateToken, getAllPayments);
router.get("/me", authenticateToken, getMyPayments);
router.get("/user/:userId", authenticateToken, getPaymentsByUserId);
router.get("/:id", authenticateToken, getPaymentById);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment processing with VNPay for subscriptions, charging fees, and base fees
 */

/**
 * @swagger
 * /api/payment:
 *   get:
 *     summary: Get all payments (with populated invoice information)
 *     description: >
 *       Get a list of all payments with populated invoice information.
 *       For charging payments with multiple invoices, the `invoice_ids` array will be populated with all invoice details.
 *       Supports filtering by payment type and user ID, with pagination.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subscription, charging, base_fee]
 *         description: Filter by payment type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of payments with populated invoice information
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
 *                         example: "507f1f77bcf86cd799439011"
 *                       madeBy:
 *                         type: object
 *                         description: Populated user account
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
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
 *                               format: date-time
 *                             end_time:
 *                               type: string
 *                               format: date-time
 *                             charging_duration_formatted:
 *                               type: string
 *                             energy_delivered_kwh:
 *                               type: number
 *                         description: All invoices associated with this payment (populated)
 *                       type:
 *                         type: string
 *                         enum: [subscription, charging, base_fee]
 *                         example: "charging"
 *                       vnp_Amount:
 *                         type: number
 *                         example: 155000
 *                       vnp_TxnRef:
 *                         type: string
 *                       vnp_TransactionNo:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/me:
 *   get:
 *     summary: Get my payments (current user's payments with populated invoice information)
 *     description: >
 *       Get all payments made by the currently authenticated user with populated invoice information.
 *       The user ID is automatically extracted from the JWT token.
 *       For charging payments with multiple invoices, the `invoice_ids` array will be populated.
 *       Supports filtering by payment type and pagination.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subscription, charging, base_fee]
 *         description: Filter by payment type
 *     responses:
 *       200:
 *         description: List of current user's payments with populated invoice information
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
 *                               format: date-time
 *                             end_time:
 *                               type: string
 *                               format: date-time
 *                             charging_duration_formatted:
 *                               type: string
 *                             energy_delivered_kwh:
 *                               type: number
 *                         description: All invoices associated with this payment (populated)
 *                       type:
 *                         type: string
 *                         enum: [subscription, charging, base_fee]
 *                       vnp_Amount:
 *                         type: number
 *                       vnp_TxnRef:
 *                         type: string
 *                       vnp_TransactionNo:
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
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/{id}:
 *   get:
 *     summary: Get payment by ID (with populated invoice information)
 *     description: >
 *       Get a single payment by ID with all invoice information populated.
 *       If the payment has multiple invoices, the `invoice_ids` array will contain all invoice details.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Payment details with populated invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 madeBy:
 *                   type: object
 *                   description: Populated user account
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                 invoice_ids:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       total_amount:
 *                         type: number
 *                       payment_status:
 *                         type: string
 *                       station_name:
 *                         type: string
 *                       vehicle_plate_number:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       charging_duration_formatted:
 *                         type: string
 *                       energy_delivered_kwh:
 *                         type: number
 *                   description: All invoices associated with this payment (populated with full details)
 *                 type:
 *                   type: string
 *                   enum: [subscription, charging, base_fee]
 *                   example: "charging"
 *                 vnp_Amount:
 *                   type: number
 *                   example: 465000
 *                 vnp_TxnRef:
 *                   type: string
 *                 vnp_TransactionNo:
 *                   type: string
 *                 vnp_BankCode:
 *                   type: string
 *                 vnp_PayDate:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment not found"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/user/{userId}:
 *   get:
 *     summary: Get payments by user ID (with populated invoice information)
 *     description: >
 *       Get all payments made by a specific user with populated invoice information.
 *       For charging payments with multiple invoices, the `invoice_ids` array will be populated.
 *       Supports filtering by payment type and pagination.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "507f1f77bcf86cd799439013"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subscription, charging, base_fee]
 *         description: Filter by payment type
 *     responses:
 *       200:
 *         description: List of user payments with populated invoice information
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
 *                       invoice_ids:
 *                         type: array
 *                         items:
 *                           type: object
 *                         description: All invoices associated with this payment (populated)
 *                       type:
 *                         type: string
 *                       vnp_Amount:
 *                         type: number
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
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/payment-test:
 *   post:
 *     summary: Payment test - Simple payment API that only requires amount (No authentication required)
 *     tags: [Payment]
 *     security: []  # No authentication required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in VND
 *                 example: 100000
 *     responses:
 *       200:
 *         description: Payment URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment URL generated successfully"
 *                 paymentUrl:
 *                   type: string
 *                   description: VNPay payment URL
 *                 txnRef:
 *                   type: string
 *                   description: Transaction reference number
 *                 amount:
 *                   type: number
 *                   example: 100000
 *       400:
 *         description: Invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Amount is required and must be greater than 0"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/pay-for-subscription:
 *   post:
 *     summary: Create VNPay payment URL for subscription purchase
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - vehicle_id
 *               - subscription_id
 *               - userId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in VND (will be multiplied by 100 for VNPay)
 *                 example: 500000
 *               vehicle_id:
 *                 type: string
 *                 description: ID of the vehicle
 *                 example: "507f1f77bcf86cd799439011"
 *               subscription_id:
 *                 type: string
 *                 description: ID of the subscription plan (start_date and end_date will be auto-calculated)
 *                 example: "507f1f77bcf86cd799439012"
 *               userId:
 *                 type: string
 *                 description: ID of the user making the payment
 *                 example: "507f1f77bcf86cd799439013"
 *               auto_renew:
 *                 type: boolean
 *                 description: Whether the subscription should auto-renew
 *                 default: false
 *                 example: false
 *               payment_status:
 *                 type: string
 *                 enum: [paid, pending, failed, refunded]
 *                 description: Initial payment status
 *                 default: pending
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: VNPay payment URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: VNPay payment URL (redirect user to this URL)
 *               example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
 *       400:
 *         description: Invalid request body or validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/pay-for-base-fee:
 *   post:
 *     summary: Create VNPay payment URL for base fee payment (for booking confirmation)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - userId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in VND (will be multiplied by 100 for VNPay)
 *                 example: 50000
 *               userId:
 *                 type: string
 *                 description: ID of the user making the payment
 *                 example: "507f1f77bcf86cd799439013"
 *               booking_id:
 *                 type: string
 *                 description: ID of the booking to confirm after successful payment (optional)
 *                 example: "507f1f77bcf86cd799439014"
 *     responses:
 *       201:
 *         description: VNPay payment URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: VNPay payment URL (redirect user to this URL)
 *               example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
 *       400:
 *         description: Invalid request body or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: amount, userId"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/pay-for-charging:
 *   post:
 *     summary: Create VNPay payment URL for charging fee payment (supports multiple invoices)
 *     description: >
 *       Create a payment URL to pay for one or multiple charging invoices.
 *       Pass `invoiceIds` (array of strings) - can contain single or multiple invoice IDs.
 *       After successful payment, all invoices will be updated to "paid" status and saved in the `invoice_ids` array.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - invoiceIds
 *               - userId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Total payment amount in VND for all invoices (will be multiplied by 100 for VNPay)
 *                 example: 155000
 *               invoiceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of invoice IDs to pay (can contain single or multiple invoice IDs)
 *                 example: ["507f1f77bcf86cd799439015", "507f1f77bcf86cd799439016", "507f1f77bcf86cd799439017"]
 *               userId:
 *                 type: string
 *                 description: ID of the user making the payment
 *                 example: "507f1f77bcf86cd799439013"
 *     responses:
 *       201:
 *         description: VNPay payment URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: VNPay payment URL (redirect user to this URL)
 *               example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
 *       400:
 *         description: Invalid request body or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: invoiceIds (array), amount, userId"
 *       500:
 *         description: Internal server error
 */