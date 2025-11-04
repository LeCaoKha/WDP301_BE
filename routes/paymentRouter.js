const express = require("express");
const {
  payForSubscription,
  payForSubscriptionReturn,
  payForCharging,
  payForChargingReturn,
  payForBaseFee,
  payForBaseFeeReturn,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/pay-for-subscription", payForSubscription);
router.get(
  "/pay-for-subscription-return/:vehicleSubscriptionId",
  payForSubscriptionReturn
);
router.post("/pay-for-charging", payForCharging);
router.get("/pay-for-charging-return/:txnRef", payForChargingReturn);
router.post("/pay-for-base-fee", payForBaseFee);
router.get("/pay-for-base-fee-return/:txnRef", payForBaseFeeReturn);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment processing with VNPay for subscriptions, charging fees, and base fees
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
 * /api/payment/pay-for-base-fee-return/{txnRef}:
 *   get:
 *     summary: VNPay callback URL for base fee payment return
 *     description: This endpoint is called by VNPay after payment completion. If booking_id was provided, it will automatically call the booking confirmation API.
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: txnRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference number
 *     responses:
 *       302:
 *         description: Redirects to mobile app deep link
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: Deep link URL for mobile app
 *             example: "evchargingapp://vnpay/return?status=success&type=base_fee&txnRef=1234567890&booking_id=507f1f77bcf86cd799439014"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/pay-for-charging:
 *   post:
 *     summary: Create VNPay payment URL for charging fee payment
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - invoiceId
 *               - userId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in VND (will be multiplied by 100 for VNPay)
 *                 example: 155000
 *               invoiceId:
 *                 type: string
 *                 description: ID of the invoice to pay
 *                 example: "507f1f77bcf86cd799439015"
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
 *                   example: "Missing required fields: invoiceId, amount, userId"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/pay-for-charging-return/{txnRef}:
 *   get:
 *     summary: VNPay callback URL for charging fee payment return
 *     description: This endpoint is called by VNPay after payment completion for charging fees.
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: txnRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference number
 *     responses:
 *       302:
 *         description: Redirects to mobile app deep link
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: Deep link URL for mobile app
 *             example: "evchargingapp://vnpay/return?status=success&invoiceId=507f1f77bcf86cd799439015&txnRef=1234567890"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/pay-for-charging:
 *   post:
 *     summary: Create VNPay payment URL for charging invoice payment
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *               - userId
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 description: ID of the invoice to be paid
 *                 example: "507f1f77bcf86cd799439011"
 *               amount:
 *                 type: number
 *                 description: Payment amount in VND (will be multiplied by 100 for VNPay)
 *                 example: 100000
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
 *         description: Missing required fields (invoiceId, amount, userId)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/pay-for-base-fee:
 *   post:
 *     summary: Create VNPay payment URL for base fee payment
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
 *         description: Missing required fields (amount, userId)
 *       500:
 *         description: Internal server error
 */
