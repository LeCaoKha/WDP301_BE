const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { verifyToken, checkRole } = require("../middleware/auth");
const {
  uploadMultiple,
  handleUploadError,
} = require("../middleware/uploadImage");

/**
 * @swagger
 * tags:
 *   name: Staff Reports
 *   description: Quản lý báo cáo của nhân viên
 */

/**
 * @swagger
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
 */
router.post(
  "/reports",
  verifyToken,
  checkRole(["staff", "admin"]),
  uploadMultiple,
  handleUploadError,
  staffController.createReport
);

/**
 * @swagger
 * /api/staff/reports:
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
 */
router.get(
  "/reports",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.getAllReports
);

/**
 * @swagger
 * /api/staff/reports/my:
 *   get:
 *     summary: Lấy reports của chính mình
 *     tags: [Staff Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách reports của user
 */
router.get(
  "/reports/my",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.getMyReports
);

/**
 * @swagger
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
 */
router.get(
  "/reports/:id",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.getReportById
);

/**
 * @swagger
 * /api/staff/reports/{id}:
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
 */
router.put(
  "/reports/:id",
  verifyToken,
  checkRole(["staff", "admin"]),
  uploadMultiple,
  handleUploadError,
  staffController.updateReport
);

/**
 * @swagger
 * /api/staff/reports/{id}:
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
 */
router.delete(
  "/reports/:id",
  verifyToken,
  checkRole(["staff", "admin"]),
  staffController.deleteReport
);

/**
 * @swagger
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
router.patch(
  "/reports/:id/status",
  verifyToken,
  checkRole(["admin"]),
  staffController.updateReportStatus
);

module.exports = router;
