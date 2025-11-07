const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Vehicle = require("../models/Vehicle");
const VehicleSubscription = require("../models/VehicleSubscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");

// ============== GET ALL PAYMENTS ==============
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, userId } = req.query;

    let filter = {};
    if (type) filter.type = type;
    if (userId) filter.madeBy = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .populate("madeBy", "username email phone")
      .populate({
        path: "invoice_ids",
        select:
          "total_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() to get plain objects and avoid virtuals

    const total = await Payment.countDocuments(filter);

    // Filter out null invoices from invoice_ids array
    const formattedPayments = payments.map((payment) => {
      if (payment.invoice_ids && Array.isArray(payment.invoice_ids)) {
        payment.invoice_ids = payment.invoice_ids.filter(
          (inv) => inv !== null && inv !== undefined
        );
      }
      return payment;
    });

    res.status(200).json({
      payments: formattedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET PAYMENT BY ID ==============
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate("madeBy", "username email phone")
      .populate({
        path: "invoice_ids",
        select:
          "total_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
      })
      .lean(); // Use lean() to get plain objects and avoid virtuals

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Filter out null invoices from invoice_ids array
    if (payment.invoice_ids && Array.isArray(payment.invoice_ids)) {
      payment.invoice_ids = payment.invoice_ids.filter(
        (inv) => inv !== null && inv !== undefined
      );
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET MY PAYMENTS ==============
exports.getMyPayments = async (req, res) => {
  try {
    // Get user ID from JWT token (set by auth middleware)
    const userId = req.user.accountId;
    const { page = 1, limit = 10, type } = req.query;

    let filter = { madeBy: userId };
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .populate({
        path: "invoice_ids",
        select:
          "total_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() to get plain objects and avoid virtuals

    const total = await Payment.countDocuments(filter);

    // Filter out null invoices from invoice_ids array
    const formattedPayments = payments.map((payment) => {
      if (payment.invoice_ids && Array.isArray(payment.invoice_ids)) {
        payment.invoice_ids = payment.invoice_ids.filter(
          (inv) => inv !== null && inv !== undefined
        );
      }
      return payment;
    });

    res.status(200).json({
      payments: formattedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET PAYMENTS BY USER ID ==============
exports.getPaymentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    let filter = { madeBy: userId };
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .populate({
        path: "invoice_ids",
        select:
          "total_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() to get plain objects and avoid virtuals

    const total = await Payment.countDocuments(filter);

    // Filter out null invoices from invoice_ids array
    const formattedPayments = payments.map((payment) => {
      if (payment.invoice_ids && Array.isArray(payment.invoice_ids)) {
        payment.invoice_ids = payment.invoice_ids.filter(
          (inv) => inv !== null && inv !== undefined
        );
      }
      return payment;
    });

    res.status(200).json({
      payments: formattedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const url = require("url");
const querystring = require("querystring");
const { findById } = require("../models/Vehicle");
const tmnCode = "MTZVDR2T";
const secureSecret = "C70JGHY1X7BQ2B98HO2S7X9BNLQ4JGDX";

// Test user ID cố định cho test payments (không cần đăng nhập)
// Sử dụng một ObjectId hợp lệ để fix cứng
const TEST_USER_ID = new mongoose.Types.ObjectId("000000000000000000000000");

// Payment Test - Simple payment API that only requires amount
exports.paymentTest = async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Amount is required and must be greater than 0",
      });
    }

    const vnpay = new VNPay({
      tmnCode,
      secureSecret,
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const txnRef = Date.now().toString();

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Payment Test - Amount: ${amount}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.VNPAY_RETURN_URL}/api/payment/payment-test-return/${txnRef}`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(200).json({
      message: "Payment URL generated successfully",
      paymentUrl: vnpayResponse,
      txnRef: txnRef,
      amount: amount,
    });
  } catch (error) {
    console.error("Error in paymentTest:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Payment Test Return - Handle VNPay callback for payment test
exports.paymentTestReturn = async (req, res) => {
  try {
    const txnRef = req.params.txnRef;

    const rawUrl = req.originalUrl || req.url;
    const parsedUrl = url.parse(rawUrl);
    const rawQuery = parsedUrl.query || "";

    // Parse query parameters
    const queryParams = rawQuery
      .split("&")
      .filter((p) => p && p.includes("="))
      .reduce((acc, param) => {
        const idx = param.indexOf("=");
        const key = param.substring(0, idx);
        const value = param.substring(idx + 1);
        acc[key] = value;
        return acc;
      }, {});

    const secureHash = queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHashType"];

    const sortedKeys = Object.keys(queryParams).sort();
    const signData = sortedKeys
      .map((key) => `${key}=${queryParams[key]}`)
      .join("&");

    const computedHash = crypto
      .createHmac("sha512", secureSecret)
      .update(signData)
      .digest("hex");

    // Verify signature and check payment success
    if (
      computedHash.toLowerCase() === String(secureHash || "").toLowerCase() &&
      queryParams.vnp_ResponseCode === "00"
    ) {
      // Payment successful - Save payment record
      // Sử dụng TEST_USER_ID cố định cho test payments
      const newPayment = new Payment({
        madeBy: TEST_USER_ID, // Fixed test user ID
        type: "charging", // Using existing type
        vnp_TxnRef: queryParams.vnp_TxnRef,
        vnp_Amount: Number(queryParams.vnp_Amount) / 100,
        vnp_OrderInfo: decodeURIComponent(queryParams.vnp_OrderInfo || ""),
        vnp_TransactionNo: queryParams.vnp_TransactionNo,
        vnp_BankCode: queryParams.vnp_BankCode,
        vnp_CardType: queryParams.vnp_CardType,
        vnp_PayDate: queryParams.vnp_PayDate,
        vnp_ResponseCode: queryParams.vnp_ResponseCode,
        vnp_TransactionStatus: queryParams.vnp_TransactionStatus,
        vnp_SecureHash: secureHash,
      });
      await newPayment.save();

      // Redirect đến trang HTML thông báo thanh toán thành công
      const baseUrl =
        process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
      return res.redirect(
        `${baseUrl}/payment-success.html?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${Number(queryParams.vnp_Amount) / 100}`
      );
    }

    // Payment failed or signature mismatch - redirect đến trang HTML thông báo thất bại
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}`
    );
  } catch (error) {
    console.error("Error in paymentTestReturn:", error);
    // Redirect đến trang HTML thông báo lỗi khi có lỗi xử lý
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment return"
      )}`
    );
  }
};

exports.payForSubscription = async (req, res) => {
  try {
    const {
      amount,
      vehicle_id,
      subscription_id,
      userId,
      auto_renew = 0,
      payment_status = 0,
    } = req.body;

    const vnpay = new VNPay({
      tmnCode,
      secureSecret,
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const txnRef = Date.now().toString();

    // 👇 Gửi toàn bộ dữ liệu cần thiết trong vnp_OrderInfo (không cần start_date và end_date)
    const orderInfo = new URLSearchParams({
      vehicle_id,
      subscription_id,
      auto_renew,
      payment_status,
      userId,
    }).toString();

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.VNPAY_RETURN_URL}/api/payment/pay-for-subscription-return/${txnRef}`, // txnRef dùng làm ID giao dịch
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json(vnpayResponse);
  } catch (error) {
    console.error("Error in payForSubscription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.payForSubscriptionReturn = async (req, res) => {
  try {
    const txnRef = req.params.txnRef; // txnRef từ URL parameter

    const rawUrl = req.originalUrl || req.url;
    const parsedUrl = url.parse(rawUrl);
    const rawQuery = parsedUrl.query || "";

    // Parse query giữ nguyên encoding
    const queryParams = rawQuery
      .split("&")
      .filter((p) => p && p.includes("="))
      .reduce((acc, param) => {
        const idx = param.indexOf("=");
        const key = param.substring(0, idx);
        const value = param.substring(idx + 1);
        acc[key] = value;
        return acc;
      }, {});

    const secureHash = queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHashType"];

    const sortedKeys = Object.keys(queryParams).sort();
    const signData = sortedKeys
      .map((key) => `${key}=${queryParams[key]}`)
      .join("&");

    const computedHash = crypto
      .createHmac("sha512", secureSecret)
      .update(signData)
      .digest("hex");

    // ✅ Kiểm tra chữ ký hợp lệ và thanh toán thành công
    if (
      computedHash.toLowerCase() === String(secureHash || "").toLowerCase() &&
      queryParams.vnp_ResponseCode === "00"
    ) {
      // Giải mã vnp_OrderInfo để lấy dữ liệu gốc
      const decodedOrderInfo = decodeURIComponent(queryParams.vnp_OrderInfo);
      const parsedInfo = Object.fromEntries(
        new URLSearchParams(decodedOrderInfo)
      );

      const {
        vehicle_id,
        subscription_id,
        auto_renew,
        payment_status,
        userId,
      } = parsedInfo;

      // ✅ Tạo bản ghi thanh toán
      const newPayment = new Payment({
        madeBy: userId,
        type: "subscription", // giữ đúng enum của bạn
        vnp_TxnRef: queryParams.vnp_TxnRef,
        vnp_Amount: Number(queryParams.vnp_Amount) / 100,
        vnp_OrderInfo: decodedOrderInfo,
        vnp_TransactionNo: queryParams.vnp_TransactionNo,
        vnp_BankCode: queryParams.vnp_BankCode,
        vnp_CardType: queryParams.vnp_CardType,
        vnp_PayDate: queryParams.vnp_PayDate,
        vnp_ResponseCode: queryParams.vnp_ResponseCode,
        vnp_TransactionStatus: queryParams.vnp_TransactionStatus,
        vnp_SecureHash: secureHash,
      });
      await newPayment.save();

      // ✅ Lấy thông tin subscription plan để tính billing cycle
      const subscriptionPlan = await SubscriptionPlan.findById(subscription_id);
      if (!subscriptionPlan) {
        console.error("Subscription plan not found");
        const baseUrl =
          process.env.VNPAY_RETURN_URL ||
          req.protocol + "://" + req.get("host");
        return res.redirect(
          `${baseUrl}/payment-failed.html?status=error&txnRef=${txnRef}&message=${encodeURIComponent(
            "Subscription plan not found"
          )}`
        );
      }

      // ✅ Tự động tính start_date và end_date dựa trên billing_cycle
      const startDate = new Date();
      let daysToAdd = 0;

      switch (subscriptionPlan.billing_cycle) {
        case "1 month":
          daysToAdd = 30;
          break;
        case "3 months":
          daysToAdd = 90;
          break;
        case "6 months":
          daysToAdd = 180;
          break;
        case "1 year":
          daysToAdd = 365;
          break;
        default:
          daysToAdd = 30;
      }

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysToAdd);

      const vehicleSubscription = await VehicleSubscription.create({
        vehicle_id,
        subscription_id,
        start_date: startDate,
        end_date: endDate,
        auto_renew,
        payment_status: "paid",
      });

      await Vehicle.findByIdAndUpdate(vehicle_id, {
        vehicle_subscription_id: vehicleSubscription._id,
      });

      console.log(
        "✅ Đã tạo VehicleSubscription mới sau thanh toán thành công"
      );

      // Redirect đến trang HTML thông báo thanh toán thành công
      const baseUrl =
        process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
      return res.redirect(
        `${baseUrl}/payment-success.html?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${
          Number(queryParams.vnp_Amount) / 100
        }&vehicleSubscriptionId=${vehicleSubscription._id}`
      );
    }

    // ❌ Hash sai hoặc không thành công - redirect đến trang HTML thông báo thất bại
    console.warn("VNPay signature mismatch or failed payment");
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}`
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay:", error);
    // Redirect đến trang HTML thông báo lỗi
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment return"
      )}`
    );
  }
};

exports.payForCharging = async (req, res) => {
  try {
    const { invoiceId, invoiceIds, amount, userId } = req.body;

    // Support both single invoiceId and array invoiceIds
    let invoiceIdArray = [];
    if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      invoiceIdArray = invoiceIds;
    } else if (invoiceId) {
      invoiceIdArray = [invoiceId];
    }

    if (invoiceIdArray.length === 0 || !amount || !userId) {
      return res.status(400).json({
        message:
          "Missing required fields: invoiceId/invoiceIds (array), amount, userId",
      });
    }

    const vnpay = new VNPay({
      tmnCode,
      secureSecret,
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const txnRef = Date.now().toString();

    // 👇 Gửi dữ liệu cần thiết trong vnp_OrderInfo (array invoiceIds)
    const orderInfo = new URLSearchParams({
      invoiceIds: invoiceIdArray.join(","), // Convert array to comma-separated string
      userId,
      type: "charging",
    }).toString();

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.VNPAY_RETURN_URL}/api/payment/pay-for-charging-return/${txnRef}`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json(vnpayResponse);
  } catch (error) {
    console.error("Error in payForCharging:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.payForChargingReturn = async (req, res) => {
  try {
    const txnRef = req.params.txnRef;

    const rawUrl = req.originalUrl || req.url;
    const parsedUrl = url.parse(rawUrl);
    const rawQuery = parsedUrl.query || "";

    // Parse query giữ nguyên encoding
    const queryParams = rawQuery
      .split("&")
      .filter((p) => p && p.includes("="))
      .reduce((acc, param) => {
        const idx = param.indexOf("=");
        const key = param.substring(0, idx);
        const value = param.substring(idx + 1);
        acc[key] = value;
        return acc;
      }, {});

    const secureHash = queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHashType"];

    const sortedKeys = Object.keys(queryParams).sort();
    const signData = sortedKeys
      .map((key) => `${key}=${queryParams[key]}`)
      .join("&");

    const computedHash = crypto
      .createHmac("sha512", secureSecret)
      .update(signData)
      .digest("hex");

    // ✅ Kiểm tra chữ ký hợp lệ và thanh toán thành công
    if (
      computedHash.toLowerCase() === String(secureHash || "").toLowerCase() &&
      queryParams.vnp_ResponseCode === "00"
    ) {
      // Giải mã vnp_OrderInfo để lấy dữ liệu gốc
      const decodedOrderInfo = decodeURIComponent(queryParams.vnp_OrderInfo);
      const parsedInfo = Object.fromEntries(
        new URLSearchParams(decodedOrderInfo)
      );

      const { invoiceIds, userId } = parsedInfo;

      // Parse invoiceIds from comma-separated string to array
      const invoiceIdArray = invoiceIds
        ? invoiceIds.split(",").filter((id) => id.trim())
        : [];

      if (invoiceIdArray.length === 0) {
        console.error("No invoice IDs found in order info");
        const baseUrl =
          process.env.VNPAY_RETURN_URL ||
          req.protocol + "://" + req.get("host");
        return res.redirect(
          `${baseUrl}/payment-failed.html?status=error&message=${encodeURIComponent(
            "No invoice IDs found"
          )}`
        );
      }

      // Import Invoice model
      const Invoice = require("../models/Invoice");

      // ✅ Tạo bản ghi thanh toán (lưu tất cả invoice IDs)
      const newPayment = new Payment({
        madeBy: userId,
        type: "charging",
        invoice_ids: invoiceIdArray, // Lưu tất cả invoice IDs vào array
        vnp_TxnRef: queryParams.vnp_TxnRef,
        vnp_Amount: Number(queryParams.vnp_Amount) / 100,
        vnp_OrderInfo: decodedOrderInfo,
        vnp_TransactionNo: queryParams.vnp_TransactionNo,
        vnp_BankCode: queryParams.vnp_BankCode,
        vnp_CardType: queryParams.vnp_CardType,
        vnp_PayDate: queryParams.vnp_PayDate,
        vnp_ResponseCode: queryParams.vnp_ResponseCode,
        vnp_TransactionStatus: queryParams.vnp_TransactionStatus,
        vnp_SecureHash: secureHash,
      });
      await newPayment.save();

      // ✅ Cập nhật payment_status cho tất cả invoice trong array
      try {
        await Invoice.updateMany(
          { _id: { $in: invoiceIdArray } },
          {
            $set: {
              payment_status: "paid",
              payment_date: new Date(),
              transaction_id: queryParams.vnp_TransactionNo,
            },
          }
        );
        console.log(
          `✅ Đã cập nhật payment_status cho ${invoiceIdArray.length} invoice(s) sau thanh toán thành công`
        );
      } catch (invoiceError) {
        console.error(
          "❌ Lỗi khi cập nhật invoice payment_status:",
          invoiceError
        );
        // Không throw error để không ảnh hưởng đến redirect
      }

      console.log(
        "✅ Đã tạo Payment mới cho charging sau thanh toán thành công"
      );

      // Redirect đến trang HTML thông báo thanh toán thành công
      const baseUrl =
        process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
      return res.redirect(
        `${baseUrl}/payment-success.html?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${Number(queryParams.vnp_Amount) / 100}&invoiceCount=${
          invoiceIdArray.length
        }&invoiceIds=${invoiceIdArray.join(",")}`
      );
    }

    // ❌ Hash sai hoặc không thành công - redirect đến trang HTML thông báo thất bại
    console.warn("VNPay signature mismatch or failed payment");
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}`
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay cho charging:", error);
    // Redirect đến trang HTML thông báo lỗi
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment return"
      )}`
    );
  }
};

exports.payForBaseFee = async (req, res) => {
  try {
    const { userId, amount, booking_id } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({
        message: "Missing required fields: amount, userId",
      });
    }

    const vnpay = new VNPay({
      tmnCode,
      secureSecret,
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const txnRef = Date.now().toString();

    // 👇 Gửi dữ liệu cần thiết trong vnp_OrderInfo (bao gồm booking_id nếu có)
    const orderInfoParams = {
      userId,
      type: "base_fee",
    };

    if (booking_id) {
      orderInfoParams.booking_id = booking_id;
    }

    const orderInfo = new URLSearchParams(orderInfoParams).toString();

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.VNPAY_RETURN_URL}/api/payment/pay-for-base-fee-return/${txnRef}`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json(vnpayResponse);
  } catch (error) {
    console.error("Error in payForBaseFee:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.payForBaseFeeReturn = async (req, res) => {
  try {
    const txnRef = req.params.txnRef;

    const rawUrl = req.originalUrl || req.url;
    const parsedUrl = url.parse(rawUrl);
    const rawQuery = parsedUrl.query || "";

    // Parse query giữ nguyên encoding
    const queryParams = rawQuery
      .split("&")
      .filter((p) => p && p.includes("="))
      .reduce((acc, param) => {
        const idx = param.indexOf("=");
        const key = param.substring(0, idx);
        const value = param.substring(idx + 1);
        acc[key] = value;
        return acc;
      }, {});

    const secureHash = queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHash"];
    delete queryParams["vnp_SecureHashType"];

    const sortedKeys = Object.keys(queryParams).sort();
    const signData = sortedKeys
      .map((key) => `${key}=${queryParams[key]}`)
      .join("&");

    const computedHash = crypto
      .createHmac("sha512", secureSecret)
      .update(signData)
      .digest("hex");

    // ✅ Kiểm tra chữ ký hợp lệ và thanh toán thành công
    if (
      computedHash.toLowerCase() === String(secureHash || "").toLowerCase() &&
      queryParams.vnp_ResponseCode === "00"
    ) {
      // Giải mã vnp_OrderInfo để lấy dữ liệu gốc
      const decodedOrderInfo = decodeURIComponent(queryParams.vnp_OrderInfo);
      const parsedInfo = Object.fromEntries(
        new URLSearchParams(decodedOrderInfo)
      );

      const { userId, booking_id } = parsedInfo;

      // ✅ Tạo bản ghi thanh toán
      const newPayment = new Payment({
        madeBy: userId,
        type: "base_fee",
        vnp_TxnRef: queryParams.vnp_TxnRef,
        vnp_Amount: Number(queryParams.vnp_Amount) / 100,
        vnp_OrderInfo: decodedOrderInfo,
        vnp_TransactionNo: queryParams.vnp_TransactionNo,
        vnp_BankCode: queryParams.vnp_BankCode,
        vnp_CardType: queryParams.vnp_CardType,
        vnp_PayDate: queryParams.vnp_PayDate,
        vnp_ResponseCode: queryParams.vnp_ResponseCode,
        vnp_TransactionStatus: queryParams.vnp_TransactionStatus,
        vnp_SecureHash: secureHash,
      });
      await newPayment.save();

      console.log(
        "✅ Đã tạo Payment mới cho base_fee sau thanh toán thành công"
      );

      // ✅ Gọi API confirm booking nếu có booking_id
      if (booking_id) {
        try {
          // Extract base URL từ VNPAY_RETURN_URL
          let baseUrl;
          if (process.env.VNPAY_RETURN_URL) {
            const returnUrl = process.env.VNPAY_RETURN_URL;
            // Nếu VNPAY_RETURN_URL là full URL có path, extract base URL
            try {
              const urlObj = new URL(returnUrl);
              baseUrl = `${urlObj.protocol}//${urlObj.host}`;
            } catch (e) {
              // Nếu không phải valid URL, dùng trực tiếp
              baseUrl = returnUrl.replace(/\/api\/payment\/.*$/, "");
            }
          } else {
            // Fallback: dùng từ request
            const protocol = req.protocol || "http";
            baseUrl = `${protocol}://${
              req.get("host") || `localhost:${process.env.PORT || 5000}`
            }`;
          }

          const confirmBookingUrl = `${baseUrl}/api/bookings/${booking_id}/confirm`;

          console.log(`📞 Đang gọi API confirm booking: ${confirmBookingUrl}`);

          const confirmResponse = await axios.post(
            confirmBookingUrl,
            {},
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: 10000, // 10 seconds timeout
            }
          );

          console.log(
            "✅ Đã confirm booking thành công:",
            confirmResponse.data
          );
        } catch (confirmError) {
          console.error(
            "❌ Lỗi khi gọi API confirm booking:",
            confirmError.response?.data || confirmError.message
          );
          // Không throw error để không ảnh hưởng đến redirect của payment
          // Payment đã thành công, chỉ log lỗi confirm booking
        }
      }

      // Redirect đến trang HTML thông báo thanh toán thành công
      const baseUrl =
        process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
      return res.redirect(
        `${baseUrl}/payment-success.html?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${Number(queryParams.vnp_Amount) / 100}&type=base_fee${
          booking_id ? `&booking_id=${booking_id}` : ""
        }`
      );
    }

    // ❌ Hash sai hoặc không thành công - redirect đến trang HTML thông báo thất bại
    console.warn("VNPay signature mismatch or failed payment");
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}`
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay cho base_fee:", error);
    // Redirect đến trang HTML thông báo lỗi
    const baseUrl =
      process.env.VNPAY_RETURN_URL || req.protocol + "://" + req.get("host");
    return res.redirect(
      `${baseUrl}/payment-failed.html?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment return"
      )}`
    );
  }
};
