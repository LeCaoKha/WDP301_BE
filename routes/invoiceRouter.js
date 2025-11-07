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
 *         charging_duration_seconds:
 *           type: number
 *           description: Total charging duration in seconds
 *           example: 5400
 *         charging_duration_minutes:
 *           type: number
 *           description: Total charging duration in minutes
 *           example: 90
 *         charging_duration_hours:
 *           type: number
 *           description: Total charging duration in hours
 *           example: 1.5
 *         charging_duration_formatted:
 *           type: string
 *           description: Human-readable duration format
 *           example: "1 giờ 30 phút 45 giây"
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
 *     summary: Get all invoices (Admin only)
 *     description: |
 *       Admin endpoint to retrieve all invoices with pagination and filtering options.
 *       Returns formatted invoice data with station, vehicle, and payment information.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
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
 *         description: Filter by user/driver ID
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: string
 *         description: Filter by charging station ID
 *     responses:
 *       200:
 *         description: Successfully retrieved invoices with statistics
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
 *                         example: "507f1f77bcf86cd799439011"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       station:
 *                         type: string
 *                         example: "EV Station Downtown"
 *                       address:
 *                         type: string
 *                         example: "123 Main St, District 1"
 *                       vehicle:
 *                         type: string
 *                         example: "Tesla Model 3 - 29A-12345"
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       duration:
 *                         type: string
 *                         example: "1 giờ 30 phút"
 *                       duration_seconds:
 *                         type: number
 *                         example: 5400
 *                       energy_delivered:
 *                         type: string
 *                         example: "36.50 kWh"
 *                       battery_charged:
 *                         type: string
 *                         example: "60%"
 *                       total_amount:
 *                         type: string
 *                         example: "122,500 đ"
 *                       payment_status:
 *                         type: string
 *                         enum: [unpaid, paid, refunded, cancelled]
 *                       payment_method:
 *                         type: string
 *                         example: "vnpay"
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_revenue:
 *                       type: number
 *                       example: 15000000
 *                       description: Total revenue from all invoices
 *                     total_energy:
 *                       type: number
 *                       example: 5000
 *                       description: Total energy delivered (kWh)
 *                     count:
 *                       type: number
 *                       example: 150
 *                       description: Total number of invoices
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', invoiceController.getAllInvoices);

/**
 * @swagger
 * /api/invoices/user/{user_id}:
 *   get:
 *     summary: Get user's invoices
 *     description: |
 *       Get all invoices for a specific user/driver with summary statistics.
 *       **Important:** 
 *       - Unpaid invoices show only charging_fee (base_fee was already paid at booking confirmation)
 *       - Paid invoices show total_amount (base_fee + charging_fee)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User/Driver ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded, cancelled]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: User's invoices with payment summary
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
 *                         format: date-time
 *                       station:
 *                         type: string
 *                         example: "EV Station Downtown"
 *                       address:
 *                         type: string
 *                       vehicle:
 *                         type: string
 *                         example: "Tesla Model 3 - 29A-12345"
 *                       duration:
 *                         type: string
 *                         example: "1 giờ 30 phút"
 *                       duration_seconds:
 *                         type: number
 *                       energy_delivered:
 *                         type: string
 *                         example: "36.50 kWh"
 *                       battery_charged:
 *                         type: string
 *                         example: "60%"
 *                       total_amount:
 *                         type: string
 *                         description: "Unpaid: charging fee only | Paid: total amount"
 *                         example: "109,500 đ"
 *                       payment_status:
 *                         type: string
 *                         enum: [unpaid, paid, refunded, cancelled]
 *                       payment_method:
 *                         type: string
 *                         example: "vnpay"
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
 *                           example: "328,500 đ"
 *                           description: "Charging fee only (base fee already paid)"
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
 *                           example: "2,420,000 đ"
 *                           description: "Total amount (base fee + charging fee)"
 *                         total_energy:
 *                           type: string
 *                           example: "806.67 kWh"
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/user/:user_id', invoiceController.getUserInvoices);

/**
 * @swagger
 * /api/invoices/user/{user_id}/unpaid:
 *   get:
 *     summary: Get user's unpaid invoices
 *     description: |
 *       Get all unpaid invoices for a specific user/driver.
 *       **Important:** Amount shown is charging_fee only because base_fee was already paid at booking confirmation.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User/Driver ID
 *         example: "507f1f77bcf86cd799439011"
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
 *                         format: date-time
 *                       station:
 *                         type: string
 *                         example: "EV Station Downtown"
 *                       vehicle:
 *                         type: string
 *                         example: "Tesla Model 3 - 29A-12345"
 *                       energy_delivered:
 *                         type: string
 *                         example: "36.50 kWh"
 *                       charging_fee:
 *                         type: string
 *                         example: "109,500 đ"
 *                         description: "Energy cost only (base fee already paid)"
 *                       base_fee_paid:
 *                         type: string
 *                         example: "10,000 đ"
 *                         description: "Base fee that was paid at booking"
 *                       duration:
 *                         type: string
 *                         example: "1 giờ 30 phút"
 *                       duration_seconds:
 *                         type: number
 *                         example: 5400
 *                 summary:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *                       description: "Number of unpaid invoices"
 *                     total_unpaid:
 *                       type: number
 *                       example: 328500
 *                       description: "Total charging fee (VND)"
 *                     total_unpaid_formatted:
 *                       type: string
 *                       example: "328,500 đ"
 *                     note:
 *                       type: string
 *                       example: "Base fee already paid at booking confirmation. Amount shown is charging fee only."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 *                       description: Human-readable charging duration with seconds
 *                       example: "1 giờ 30 phút 45 giây"
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
 * /api/invoices/company/{company_id}/drivers:
 *   get:
 *     summary: Get all invoices of drivers in a company
 *     description: |
 *       Get all invoices of drivers belonging to a specific company with comprehensive filtering and summary.
 *       Each invoice includes driver information, charging details, and payment status.
 *       **Important:**
 *       - Unpaid invoices show charging_fee only (base_fee already paid at booking)
 *       - Paid invoices show total_amount (base_fee + charging_fee)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded, cancelled]
 *         description: Filter by payment status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *         example: "2025-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *         example: "2025-01-31"
 *     responses:
 *       200:
 *         description: Company drivers' invoices with comprehensive summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company_info:
 *                   type: object
 *                   properties:
 *                     company_id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     total_drivers:
 *                       type: integer
 *                       example: 5
 *                       description: "Total number of drivers in company"
 *                     total_vehicles:
 *                       type: integer
 *                       example: 8
 *                       description: "Total number of vehicles"
 *                 invoices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       driver:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *                             example: "john_driver"
 *                           email:
 *                             type: string
 *                             example: "john@company.com"
 *                       station:
 *                         type: string
 *                         example: "EV Station Downtown"
 *                       address:
 *                         type: string
 *                         example: "123 Main St, District 1"
 *                       vehicle:
 *                         type: string
 *                         example: "Tesla Model 3 - 29A-12345"
 *                       duration:
 *                         type: string
 *                         example: "1 giờ 30 phút"
 *                       duration_seconds:
 *                         type: number
 *                         example: 5400
 *                       energy_delivered:
 *                         type: string
 *                         example: "36.50 kWh"
 *                       battery_charged:
 *                         type: string
 *                         example: "60%"
 *                       total_amount:
 *                         type: string
 *                         example: "109,500 đ"
 *                         description: "Unpaid: charging fee | Paid: total amount"
 *                       payment_status:
 *                         type: string
 *                         enum: [unpaid, paid, refunded, cancelled]
 *                       payment_method:
 *                         type: string
 *                         example: "vnpay"
 *                       payment_date:
 *                         type: string
 *                         format: date-time
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_invoices:
 *                       type: integer
 *                       example: 50
 *                       description: "Total invoices for all company drivers"
 *                     unpaid:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 10
 *                         total_amount:
 *                           type: string
 *                           example: "1,500,000 đ"
 *                           description: "Total charging fee only"
 *                         total_energy:
 *                           type: string
 *                           example: "500.00 kWh"
 *                         note:
 *                           type: string
 *                           example: "Base fee already paid at booking confirmation"
 *                     paid:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 35
 *                         total_amount:
 *                           type: string
 *                           example: "3,200,000 đ"
 *                           description: "Total amount (base fee + charging fee)"
 *                         total_energy:
 *                           type: string
 *                           example: "1,066.67 kWh"
 *                     refunded:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 5
 *                         total_amount:
 *                           type: string
 *                           example: "450,000 đ"
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No drivers found for this company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No drivers found for this company"
 *                 company_id:
 *                   type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/company/:company_id/drivers', invoiceController.getCompanyDriversInvoices);

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
