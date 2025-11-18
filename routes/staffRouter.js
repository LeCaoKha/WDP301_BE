const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { verifyToken, checkRole } = require("../middleware/auth");
const {
  uploadMultiple,
  handleUploadError,
} = require("../middleware/uploadImage");

router.post(
  "/reports",
  verifyToken,
  checkRole(["staff", "admin"]),
  uploadMultiple,
  handleUploadError,
  staffController.createReport
);

router.get(
  "/reports",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.getAllReports
);

router.get(
  "/reports/my",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.getMyReports
);

router.get(
  "/reports/:id",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.getReportById
);

router.put(
  "/reports/:id",
  verifyToken,
  checkRole(["staff", "admin"]),
  uploadMultiple,
  handleUploadError,
  staffController.updateReport
);

router.delete(
  "/reports/:id",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.deleteReport
);

router.patch(
  "/reports/:id/status",
  verifyToken,
  checkRole(["admin"]),
  staffController.updateReportStatus
);

router.get(
  "/without-station",
  verifyToken,
  checkRole(["admin"]),
  staffController.getStaffWithoutStation
);

router.get(
  "/in-station/:station_id",
  verifyToken,
  checkRole(["admin"]),
  staffController.getStaffInStation
);

router.get(
  "/reports/station/:station_id",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.getReportsByStationId
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Staff Reports
 *   description: Quản lý báo cáo của nhân viên
 *
 * /api/staff/reports:
 *   post:
 *     summary: Tạo report mới (có thể upload nhiều ảnh)
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Tạo report thành công
 *   get:
 *     summary: Lấy tất cả reports (Admin hoặc lọc theo user)
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, resolved, rejected]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách reports
 *
 * /api/staff/reports/my:
 *   get:
 *     summary: Lấy reports của chính mình
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách reports của user
 *
 * /api/staff/reports/{id}:
 *   get:
 *     summary: Lấy report theo ID
 *     tags: [Staff Reports]
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
 *         description: Thông tin report
 *   put:
 *     summary: Cập nhật report (có thể thêm/xóa ảnh)
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, processing, resolved, rejected]
 *               removeImageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách imagePublicId cần xóa
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa report
 *     tags: [Staff Reports]
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
 *         description: Xóa thành công
 *
 * /api/staff/reports/{id}/status:
 *   patch:
 *     summary: Cập nhật status report (chỉ Admin)
 *     tags: [Staff Reports]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, resolved, rejected]
 *     responses:
 *       200:
 *         description: Cập nhật status thành công
 */
/**
 * @swagger
 * /api/staff/without-station:
 *   get:
 *     summary: Lấy tất cả staff không có station
 *     description: >
 *       Lấy danh sách tất cả staff accounts có station_id = null (chưa được gán vào station nào).
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách staff không có station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 staffs:
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
 *                         example: staff
 *                       status:
 *                         type: string
 *                         example: active
 *                       station_id:
 *                         type: null
 *                         description: "Station reference (null vì chưa có station)"
 *                       company_id:
 *                         oneOf:
 *                           - type: string
 *                           - type: null
 *                         description: "Company reference (populated with company details)"
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token, hoặc không có quyền admin
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/staff/in-station/{station_id}:
 *   get:
 *     summary: Lấy tất cả staff trong một station
 *     description: >
 *       Lấy danh sách tất cả staff accounts có station_id trùng với station_id được truyền vào.
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của station cần lấy danh sách staff
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Danh sách staff trong station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 station_id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 staffs:
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
 *                         example: staff
 *                       status:
 *                         type: string
 *                         example: active
 *                       station_id:
 *                         oneOf:
 *                           - type: string
 *                           - type: null
 *                         description: "Station reference (populated with station details)"
 *                       company_id:
 *                         oneOf:
 *                           - type: string
 *                           - type: null
 *                         description: "Company reference (populated with company details)"
 *       400:
 *         description: Bad request (thiếu station_id)
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token, hoặc không có quyền admin
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/staff/reports/station/{station_id}:
 *   get:
 *     summary: Lấy tất cả reports theo station_id
 *     description: >
 *       Lấy danh sách tất cả reports của một station cụ thể.
 *       Có thể filter theo status (pending, processing, resolved, rejected).
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của station cần lấy danh sách reports
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, resolved, rejected]
 *         description: Filter reports theo status (optional)
 *         example: "pending"
 *     responses:
 *       200:
 *         description: Danh sách reports của station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 station_id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 total:
 *                   type: integer
 *                   example: 10
 *                 status_filter:
 *                   type: string
 *                   example: "pending"
 *                   description: "Chỉ có khi có query parameter status"
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                       station_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             imageUrl:
 *                               type: string
 *                             imagePublicId:
 *                               type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, processing, resolved, rejected]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request (thiếu station_id hoặc status không hợp lệ)
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token, hoặc không có quyền staff/admin
 *       500:
 *         description: Server error
 */
