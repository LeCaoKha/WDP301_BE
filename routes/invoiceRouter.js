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
 *     description: Get all invoices for a user. Note - Unpaid invoices show only charging fee (base fee already paid at booking), paid invoices show total amount.
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
 *                       address:
 *                         type: string
 *                       vehicle:
 *                         type: string
 *                         example: "Tesla Model 3 - 29A-12345"
 *                       duration:
 *                         type: string
 *                         example: "1h 30m"
 *                       energy_delivered:
 *                         type: string
 *                         example: "36.50 kWh"
 *                       battery_charged:
 *                         type: string
 *                         example: "60%"
 *                       total_amount:
 *                         type: string
 *                         description: For unpaid - shows charging fee only (base fee already paid). For paid - shows total amount.
 *                         example: "109,500 đ"
 *                       payment_status:
 *                         type: string
 *                         enum: [unpaid, paid, refunded, cancelled]
 *                       payment_method:
 *                         type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_invoices:
 *                       type: integer
 *                       example: 25
 *                     unpaid:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 3
 *                         total_amount:
 *                           type: string
 *                           description: Total charging fee only (base fee already paid at booking)
 *                           example: "328,500 đ"
 *                         total_energy:
 *                           type: string
 *                           example: "109.50 kWh"
 *                         note:
 *                           type: string
 *                           example: "Base fee already paid at booking confirmation"
 *                     paid:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 22
 *                         total_amount:
 *                           type: string
 *                           description: Total amount including base fee and charging fee
 *                           example: "2,420,000 đ"
 *                         total_energy:
 *                           type: string
 *                           example: "806.67 kWh"
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
router.get('/user/:user_id', invoiceController.getUserInvoices);

/**
 * @swagger
 * /api/invoices/user/{user_id}/unpaid:
 *   get:
 *     summary: Get user's unpaid invoices
 *     description: Get all unpaid invoices for a user. Amount shown is charging fee only (base fee already paid at booking confirmation).
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
 *         description: List of unpaid invoices (charging fee only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unpaid_invoices:
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
 *                         example: "Tesla Model 3 - 29A-12345"
 *                       energy_delivered:
 *                         type: string
 *                         example: "36.50 kWh"
 *                       charging_fee:
 *                         type: string
 *                         description: Charging fee only (base fee already paid)
 *                         example: "109,500 đ"
 *                       base_fee_paid:
 *                         type: string
 *                         description: Base fee that was already paid at booking
 *                         example: "10,000 đ"
 *                       duration:
 *                         type: string
 *                         example: "1h 30m"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     total_unpaid:
 *                       type: number
 *                       description: Total charging fee (excluding base fees)
 *                       example: 328500
 *                     total_unpaid_formatted:
 *                       type: string
 *                       example: "328,500 đ"
 *                     note:
 *                       type: string
 *                       example: "Base fee already paid at booking confirmation. Amount shown is charging fee only."
 *       500:
 *         description: Server error
 */
router.get('/user/:user_id/unpaid', invoiceController.getUnpaidInvoices);

/**
 * @swagger
 * /api/invoices/{invoice_id}:
 *   get:
 *     summary: Get invoice detail
 *     description: Get detailed invoice information including charging session, pricing breakdown, and payment status.
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
 *                   properties:
 *                     id:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                 station_info:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                 vehicle_info:
 *                   type: object
 *                   properties:
 *                     model:
 *                       type: string
 *                     plate_number:
 *                       type: string
 *                     battery_capacity:
 *                       type: string
 *                       example: "75 kWh"
 *                 charging_session:
 *                   type: object
 *                   properties:
 *                     start_time:
 *                       type: string
 *                     end_time:
 *                       type: string
 *                     duration:
 *                       type: string
 *                       example: "1h 30m"
 *                     initial_battery:
 *                       type: string
 *                       example: "30%"
 *                     final_battery:
 *                       type: string
 *                       example: "80%"
 *                     target_battery:
 *                       type: string
 *                       example: "80%"
 *                     battery_charged:
 *                       type: string
 *                       example: "50%"
 *                     target_reached:
 *                       type: boolean
 *                     energy_delivered:
 *                       type: string
 *                       example: "37.50 kWh"
 *                     power_capacity:
 *                       type: string
 *                       example: "50 kW"
 *                     calculation_method:
 *                       type: string
 *                       enum: [actual, estimated]
 *                 pricing:
 *                   type: object
 *                   properties:
 *                     base_fee:
 *                       type: number
 *                       example: 10000
 *                     base_fee_formatted:
 *                       type: string
 *                       example: "10,000 đ"
 *                     price_per_kwh:
 *                       type: number
 *                       example: 3000
 *                     price_per_kwh_formatted:
 *                       type: string
 *                       example: "3,000 đ/kWh"
 *                     charging_fee:
 *                       type: number
 *                       example: 112500
 *                     charging_fee_formatted:
 *                       type: string
 *                       example: "112,500 đ"
 *                     total_amount:
 *                       type: number
 *                       example: 122500
 *                     total_amount_formatted:
 *                       type: string
 *                       example: "122,500 đ"
 *                     breakdown:
 *                       type: string
 *                       example: "Base Fee: 10,000 đ + Charging (37.50 kWh × 3,000 đ/kWh): 112,500 đ"
 *                 payment:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [unpaid, paid, refunded, cancelled]
 *                     method:
 *                       type: string
 *                       enum: [vnpay]
 *                     payment_date:
 *                       type: string
 *                     transaction_id:
 *                       type: string
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
