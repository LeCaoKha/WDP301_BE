const express = require("express");
const {
  getPaymentUrl,
  vnpayReturn,
} = require("../controllers/paymentController");

// const { protect, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// router.get("/", protect, requireRole(["staff"]), getAllBlogs);
// router.get("/:id", protect, requireRole(["staff"]), getBlogById);
// router.post("/blog", protect, requireRole(["staff"]), createBlog);

router.post("/getPaymentUrl", getPaymentUrl);
router.get("/return/:vehicleSubscriptionId", vnpayReturn);

module.exports = router;
