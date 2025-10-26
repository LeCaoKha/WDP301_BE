const express = require("express");
const {
  payForSubscription,
  payForSubscriptionReturn,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/pay-for-subscription", payForSubscription);
router.get(
  "/pay-for-subscription-return/:vehicleSubscriptionId",
  payForSubscriptionReturn
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment processing with VNPay for subscriptions
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
