const express = require('express');
const router = express.Router();
const chargingSessionController = require('../controllers/chargingSessionController');

/**
 * @swagger
 * tags:
 *   name: Charging Sessions
 *   description: Quản lý phiên sạc xe điện
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChargingSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID của session
 *         booking_id:
 *           type: string
 *           description: ID của booking
 *         chargingPoint_id:
 *           type: string
 *           description: ID của charging point
 *         vehicle_id:
 *           type: string
 *           description: ID của xe
 *         qr_code_token:
 *           type: string
 *           description: Token QR code để start session
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *           description: Trạng thái session
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: Thời gian bắt đầu
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: Thời gian kết thúc
 *         initial_battery_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: % pin ban đầu
 *         current_battery_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: % pin hiện tại
 *         target_battery_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: % pin mục tiêu
 *         base_fee:
 *           type: number
 *           description: Phí cơ bản (VND)
 *         price_per_kwh:
 *           type: number
 *           description: Giá điện mỗi kWh (VND)
 */

/**
 * @swagger
 * /api/charging-sessions/generate-qr/{booking_id}:
 *   post:
 *     summary: Tạo QR code để bắt đầu session
 *     tags: [Charging Sessions]
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của booking (phải có status confirmed)
 *         example: 6909a79051dd579e25d520fd
 *     responses:
 *       201:
 *         description: QR code đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: QR Code generated successfully
 *                 session_id:
 *                   type: string
 *                   example: 690xxx123...
 *                 qr_code_token:
 *                   type: string
 *                   example: abc123def456ghi789...
 *                 qr_url:
 *                   type: string
 *                   example: http://localhost:5000/api/charging-sessions/start/abc123def456ghi789...
 *                 booking_info:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     station:
 *                       type: string
 *                     charging_point:
 *                       type: string
 *                     vehicle:
 *                       type: string
 *       400:
 *         description: Booking không hợp lệ hoặc chưa confirmed
 *       404:
 *         description: Booking không tìm thấy
 */
router.post('/generate-qr/:booking_id', chargingSessionController.generateQRCode);

/**
 * @swagger
 * /api/charging-sessions/start:
 *   post:
 *     summary: Bắt đầu session sạc bằng QR code (dùng body)
 *     tags: [Charging Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_token
 *               - initial_battery_percentage
 *             properties:
 *               qr_token:
 *                 type: string
 *                 description: Token từ QR code (lấy từ API generate-qr)
 *                 example: abc123def456ghi789...
 *               initial_battery_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: % pin hiện tại của xe
 *                 example: 30
 *               target_battery_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: % pin muốn sạc đến (mặc định 100%)
 *                 example: 80
 *     responses:
 *       200:
 *         description: Session đã bắt đầu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Charging session started successfully
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     initial_battery:
 *                       type: string
 *                       example: "30%"
 *                     target_battery:
 *                       type: string
 *                       example: "80%"
 *                     battery_to_charge:
 *                       type: string
 *                       example: "50%"
 *                     status:
 *                       type: string
 *                       example: in_progress
 *                     charging_point:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         power_capacity:
 *                           type: string
 *                           example: "150 kW"
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         plate_number:
 *                           type: string
 *                         model:
 *                           type: string
 *                         battery_capacity:
 *                           type: string
 *                           example: "80 kWh"
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         base_fee:
 *                           type: string
 *                           example: "15,000 VND"
 *                         price_per_kwh:
 *                           type: string
 *                           example: "3,500 VND/kWh"
 *                     estimated_time:
 *                       type: object
 *                       properties:
 *                         energy_needed:
 *                           type: string
 *                           example: "40.00 kWh"
 *                         estimated_time:
 *                           type: string
 *                           example: "0.30 giờ"
 *                         estimated_completion:
 *                           type: string
 *                           format: date-time
 *                         formula:
 *                           type: string
 *                 instructions:
 *                   type: object
 *                   properties:
 *                     auto_stop:
 *                       type: string
 *                       example: Session will auto-stop at 100%
 *                     manual_stop:
 *                       type: string
 *                       example: You can stop anytime (even before reaching target)
 *                     target_warning:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc booking chưa confirmed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Booking must be confirmed before starting session
 *                     current_booking_status:
 *                       type: string
 *                       example: pending
 *                     required_status:
 *                       type: string
 *                       example: confirmed
 *                     confirm_endpoint:
 *                       type: string
 *                       example: /api/bookings/6909a79051dd579e25d520fd/confirm
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: initial_battery_percentage must be between 0 and 100
 *       404:
 *         description: QR code không hợp lệ hoặc session đã được start
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid QR code or session already started/expired
 *                 hint:
 *                   type: string
 *                   example: Make sure you generated QR for a confirmed booking
 */
router.post('/start', chargingSessionController.startSessionByQr);

/**
 * @swagger
 * /api/charging-sessions/{session_id}/end:
 *   post:
 *     summary: Kết thúc session sạc
 *     tags: [Charging Sessions]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - final_battery_percentage
 *             properties:
 *               final_battery_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: % pin cuối cùng
 *                 example: 80
 *     responses:
 *       200:
 *         description: Session đã kết thúc, Invoice đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Charging session ended successfully
 *                 target_status:
 *                   type: string
 *                   example: "✅ Đạt mục tiêu 80%"
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: string
 *                       example: "1 giờ 30 phút"
 *                     initial_battery:
 *                       type: string
 *                       example: "30%"
 *                     final_battery:
 *                       type: string
 *                       example: "80%"
 *                     battery_charged:
 *                       type: string
 *                       example: "50%"
 *                     energy_delivered:
 *                       type: string
 *                       example: "40.00 kWh"
 *                     status:
 *                       type: string
 *                       example: completed
 *                 fee_calculation:
 *                   type: object
 *                   properties:
 *                     base_fee:
 *                       type: number
 *                       example: 15000
 *                     price_per_kwh:
 *                       type: number
 *                       example: 3500
 *                     energy_charged:
 *                       type: string
 *                       example: "40.00 kWh"
 *                     charging_fee:
 *                       type: number
 *                       example: 140000
 *                     total_amount:
 *                       type: number
 *                       example: 155000
 *                     total_amount_formatted:
 *                       type: string
 *                       example: "155,000 VND"
 *                     breakdown:
 *                       type: string
 *                       example: "15,000 VND (phí cơ bản) + 40.00 kWh × 3,500 VND/kWh = 155,000 VND"
 *                 invoice:
 *                   type: object
 *                   properties:
 *                     invoice_id:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     payment_status:
 *                       type: string
 *                       example: unpaid
 *                     payment_method:
 *                       type: string
 *                       example: vnpay
 *                     total_amount:
 *                       type: string
 *                       example: "155,000 VND"
 *                 payment_data:
 *                   type: object
 *                   properties:
 *                     session_id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     vehicle_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       example: 155000
 *                     invoice_id:
 *                       type: string
 *       400:
 *         description: Session không trong trạng thái in_progress hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Session không tìm thấy
 */
router.post('/:session_id/end', chargingSessionController.endSession);

/**
 * @swagger
 * /api/charging-sessions/{session_id}/battery:
 *   patch:
 *     summary: Cập nhật % pin hiện tại (Real-time từ IoT)
 *     tags: [Charging Sessions]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của session đang sạc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_battery_percentage
 *             properties:
 *               current_battery_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: % pin hiện tại (từ IoT sensor)
 *                 example: 65
 *     responses:
 *       200:
 *         description: Battery level updated (hoặc auto-stopped nếu đạt 100%)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Cập nhật bình thường
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Battery level updated
 *                     battery_status:
 *                       type: object
 *                       properties:
 *                         initial:
 *                           type: string
 *                           example: "30%"
 *                         current:
 *                           type: string
 *                           example: "65%"
 *                         target:
 *                           type: string
 *                           example: "80%"
 *                         charged:
 *                           type: string
 *                           example: "35%"
 *                         remaining_to_target:
 *                           type: string
 *                           example: "15%"
 *                     warning:
 *                       type: object
 *                       nullable: true
 *                       description: Null nếu chưa đạt target, có object nếu đạt target
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "⚡ Target battery 80% reached! You can stop charging now."
 *                         target_reached:
 *                           type: boolean
 *                         can_stop_now:
 *                           type: boolean
 *                     can_continue:
 *                       type: boolean
 *                       example: true
 *                 - type: object
 *                   description: Tự động ngắt khi đạt 100%
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "🔋 Session auto-stopped: Battery FULL (100%)"
 *                     auto_stopped:
 *                       type: boolean
 *                       example: true
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         battery_charged:
 *                           type: string
 *                           example: "30% → 100%"
 *                         duration:
 *                           type: string
 *                           example: "2 giờ 15 phút"
 *                         total_amount:
 *                           type: string
 *                           example: "245,000 VND"
 *                     calculation:
 *                       type: object
 *       400:
 *         description: Session không active hoặc % pin không hợp lệ
 */
router.patch('/:session_id/battery', chargingSessionController.updateBatteryLevel);

/**
 * @swagger
 * /api/charging-sessions/{session_id}:
 *   get:
 *     summary: Lấy thông tin chi tiết session
 *     tags: [Charging Sessions]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của session
 *     responses:
 *       200:
 *         description: Thông tin session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChargingSession'
 *       404:
 *         description: Session không tìm thấy
 */
router.get('/:session_id', chargingSessionController.getSessionById);

/**
 * @swagger
 * /api/charging-sessions:
 *   get:
 *     summary: Lấy danh sách tất cả sessions (có phân trang & filter)
 *     tags: [Charging Sessions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Lọc theo user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số items mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChargingSession'
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
 */
router.get('/', chargingSessionController.getAllSessions);

/**
 * @swagger
 * /api/charging-sessions/{session_id}/cancel:
 *   post:
 *     summary: Hủy session (chưa hoàn thành)
 *     tags: [Charging Sessions]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của session
 *     responses:
 *       200:
 *         description: Session đã bị hủy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session cancelled successfully
 *                 session:
 *                   $ref: '#/components/schemas/ChargingSession'
 *       400:
 *         description: Không thể hủy session đã hoàn thành
 *       404:
 *         description: Session không tìm thấy
 */
router.post('/:session_id/cancel', chargingSessionController.cancelSession);

module.exports = router;