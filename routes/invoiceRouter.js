const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Invoice ID
 *         session_id:
 *           type: string
 *           description: Charging session ID
 *         user_id:
 *           type: string
 *           description: User ID
 *         booking_id:
 *           type: string
 *           description: Booking ID
 *         vehicle_id:
 *           type: string
 *           description: Vehicle ID
 *         station_id:
 *           type: string
 *           description: Station ID
 *         chargingPoint_id:
 *           type: string
 *           description: Charging point ID
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: Charging start time
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: Charging end time
 *         charging_duration_formatted:
 *           type: string
 *           example: "1h 30m"
 *         energy_delivered_kwh:
 *           type: number
 *           example: 36.5
 *         battery_charged_percentage:
 *           type: number
 *           example: 60
 *         total_amount:
 *           type: number
 *           example: 118000
 *         payment_status:
 *           type: string
 *           enum: [unpaid, paid, refunded, cancelled]
 *         payment_method:
 *           type: string
 *           enum: [vnpay]
 *         payment_date:
 *           type: string
 *           format: date-time
 *         transaction_id:
 *           type: string
 *           example: "VNPAY123456789"
 */

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices (Admin)
 *     tags: [Invoices]
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
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded, cancelled]
 *         description: Filter by payment status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: string
 *         description: Filter by station ID
 *     responses:
 *       200:
 *         description: List of invoices with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_revenue:
 *                       type: number
 *                     total_energy:
 *                       type: number
 *                     count:
 *                       type: number
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
 *       500:
 *         description: Server error
 */
router.get('/', invoiceController.getAllInvoices);

/**
 * @swagger
 * /api/invoices/user/{user_id}:
 *   get:
 *     summary: Get user's invoices
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded, cancelled]
 *     responses:
 *       200:
 *         description: User's invoices with summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       station:
 *                         type: string
 *                       vehicle:
 *                         type: string
 *                       energy_delivered:
 *                         type: string
 *                       total_amount:
 *                         type: string
 *                       payment_status:
 *                         type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_invoices:
 *                       type: integer
 *                     unpaid:
 *                       type: object
 *                     paid:
 *                       type: object
 *       500:
 *         description: Server error
 */
router.get('/user/:user_id', invoiceController.getUserInvoices);

/**
 * @swagger
 * /api/invoices/user/{user_id}/unpaid:
 *   get:
 *     summary: Get user's unpaid invoices
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of unpaid invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unpaid_invoices:
 *                   type: array
 *                   items:
 *                     type: object
 *                 summary:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                     total_unpaid:
 *                       type: number
 *                     total_unpaid_formatted:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get('/user/:user_id/unpaid', invoiceController.getUnpaidInvoices);

/**
 * @swagger
 * /api/invoices/{invoice_id}:
 *   get:
 *     summary: Get invoice detail
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: invoice_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Detailed invoice information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoice_info:
 *                   type: object
 *                 user_info:
 *                   type: object
 *                 station_info:
 *                   type: object
 *                 vehicle_info:
 *                   type: object
 *                 charging_session:
 *                   type: object
 *                 pricing:
 *                   type: object
 *                 payment:
 *                   type: object
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.get('/:invoice_id', invoiceController.getInvoiceDetail);

/**
 * @swagger
 * /api/invoices/{invoice_id}/payment:
 *   patch:
 *     summary: Update payment status
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: invoice_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_status
 *             properties:
 *               payment_status:
 *                 type: string
 *                 enum: [unpaid, paid, refunded, cancelled]
 *                 example: paid
 *               payment_method:
 *                 type: string
 *                 enum: [vnpay]
 *                 example: vnpay
 *               transaction_id:
 *                 type: string
 *                 example: "VNPAY123456789"
 *               notes:
 *                 type: string
 *                 example: "Thanh toán thành công qua VNPay"
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invoice:
 *                   type: object
 *       400:
 *         description: Invalid payment status or method
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.patch('/:invoice_id/payment', invoiceController.updatePaymentStatus);

module.exports = router;
