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
const Account = require("../models/Account");

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
        path: "companyId",
        select: "name address contact_email",
      })
      .populate({
        path: "invoice_ids",
        select:
          "final_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
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
        path: "companyId",
        select: "name address contact_email",
      })
      .populate({
        path: "invoice_ids",
        select:
          "final_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
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
        path: "companyId",
        select: "name address contact_email",
      })
      .populate({
        path: "invoice_ids",
        select:
          "final_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() to get plain objects and avoid virtuals

    const total = await Payment.countDocuments(filter);

    // Calculate total amount of all payments (not just current page)
    // Only sum successful payments (vnp_ResponseCode === "00")
    // Use the same filter as above (madeBy: userId) and filter by vnp_ResponseCode in the query
    const totalAmountFilter = {
      madeBy: userId, // Same userId used in filter above
    };

    if (type) {
      totalAmountFilter.type = type;
    }

    // Query all payments for this user (without pagination) for total calculation
    // Filter successful payments in the query
    const allPaymentsForTotal = await Payment.find(totalAmountFilter)
      .select("vnp_Amount vnp_ResponseCode")
      .lean();

    // Calculate total amount by summing only successful payments (vnp_ResponseCode === "00")
    const total_amount = allPaymentsForTotal.reduce((sum, payment) => {
      // Only count successful payments
      if (
        payment.vnp_ResponseCode === "00" &&
        payment.vnp_Amount != null &&
        typeof payment.vnp_Amount === "number" &&
        payment.vnp_Amount > 0
      ) {
        return sum + payment.vnp_Amount;
      }
      return sum;
    }, 0);

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
      total_amount: total_amount,
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
        path: "companyId",
        select: "name address contact_email",
      })
      .populate({
        path: "invoice_ids",
        select:
          "final_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
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

      // Redirect về app với custom URL scheme
      return res.redirect(
        `evchargingapp://payment/return?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${Number(queryParams.vnp_Amount) / 100}`
      );
    }

    // Payment failed or signature mismatch - redirect về app
    return res.redirect(
      `evchargingapp://payment/return?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}`
    );
  } catch (error) {
    console.error("Error in paymentTestReturn:", error);
    // Redirect về app khi có lỗi xử lý
    return res.redirect(
      `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
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
        return res.redirect(
          `evchargingapp://payment/return?status=error&txnRef=${txnRef}&message=${encodeURIComponent(
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

      // Redirect về app
      return res.redirect(
        `evchargingapp://payment/return?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${
          Number(queryParams.vnp_Amount) / 100
        }&vehicleSubscriptionId=${vehicleSubscription._id}&type=subscription`
      );
    }

    // ❌ Hash sai hoặc không thành công - redirect về app
    console.warn("VNPay signature mismatch or failed payment");
    return res.redirect(
      `evchargingapp://payment/return?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}&type=subscription`
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay:", error);
    // Redirect về app
    return res.redirect(
      `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment return"
      )}&type=subscription`
    );
  }
};

// ============== PAY FOR SUBSCRIPTION NO VNPAY (BACKUP API) ==============
/**
 * Backup payment API for subscription without VNPay
 * This function performs the same operations as payForSubscription but without VNPay integration
 * It directly confirms the payment and creates the subscription
 */
exports.payForSubscriptionNoVnpay = async (req, res) => {
  try {
    const {
      amount,
      vehicle_id,
      subscription_id,
      userId,
      auto_renew = 0,
      payment_status = 0,
    } = req.body;

    // Validate required fields
    if (!amount || !vehicle_id || !subscription_id || !userId) {
      return res.redirect(
        `evchargingapp://payment/return?status=failed&responseMessage=${encodeURIComponent(
          "Missing required fields: amount, vehicle_id, subscription_id, userId"
        )}&type=subscription`
      );
    }

    // Generate transaction reference
    const txnRef = Date.now().toString();
    const transactionNo = `NO-VNPAY-${txnRef}`;

    // Create order info string (same format as VNPay version)
    const orderInfo = new URLSearchParams({
      vehicle_id,
      subscription_id,
      auto_renew,
      payment_status,
      userId,
    }).toString();

    try {
      // ✅ Create payment record with fixed type = "subscription"
      const newPayment = new Payment({
        madeBy: userId,
        type: "subscription", // Fixed type
        vnp_TxnRef: txnRef,
        vnp_Amount: amount,
        vnp_OrderInfo: orderInfo,
        vnp_TransactionNo: transactionNo,
        vnp_BankCode: "NO_VNPAY", // Fixed value for non-VNPay payment
        vnp_CardType: "NO_VNPAY", // Fixed value
        vnp_PayDate: dateFormat(new Date()),
        vnp_ResponseCode: "00", // Success code
        vnp_TransactionStatus: "00", // Success status
        vnp_SecureHash: null, // No hash for non-VNPay payment
      });
      await newPayment.save();

      // ✅ Get subscription plan to calculate billing cycle
      const subscriptionPlan = await SubscriptionPlan.findById(subscription_id);
      if (!subscriptionPlan) {
        return res.redirect(
          `evchargingapp://payment/return?status=failed&txnRef=${txnRef}&responseMessage=${encodeURIComponent(
            "Subscription plan not found"
          )}&type=subscription`
        );
      }

      // ✅ Calculate start_date and end_date based on billing_cycle
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

      // ✅ Create VehicleSubscription with payment_status = "paid" (confirmed)
      const vehicleSubscription = await VehicleSubscription.create({
        vehicle_id,
        subscription_id,
        start_date: startDate,
        end_date: endDate,
        auto_renew,
        payment_status: "paid", // Confirm status
      });

      // ✅ Update vehicle with subscription ID
      await Vehicle.findByIdAndUpdate(vehicle_id, {
        vehicle_subscription_id: vehicleSubscription._id,
      });

      console.log(
        "✅ Đã tạo VehicleSubscription mới (không qua VNPay) - Payment confirmed"
      );

      // Redirect về app - success
      return res.redirect(
        `evchargingapp://payment/return?status=success&txnRef=${txnRef}&transactionNo=${transactionNo}&amount=${amount}&vehicleSubscriptionId=${vehicleSubscription._id}&type=subscription`
      );
    } catch (error) {
      console.error("❌ Lỗi trong payForSubscriptionNoVnpay:", error);
      // Redirect về app - error
      return res.redirect(
        `evchargingapp://payment/return?status=error&txnRef=${txnRef}&message=${encodeURIComponent(
          error.message || "Error processing payment"
        )}&type=subscription`
      );
    }
  } catch (error) {
    console.error("❌ Lỗi trong payForSubscriptionNoVnpay:", error);
    // Redirect về app - error
    return res.redirect(
      `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment"
      )}&type=subscription`
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
        return res.redirect(
          `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
            "No invoice IDs found"
          )}&type=charging`
        );
      }

      // Import Invoice model
      const Invoice = require("../models/Invoice");

      // ✅ Lấy company_id từ account của user thanh toán
      let companyId = null;
      try {
        const userAccount = await Account.findById(userId).select("company_id");
        if (userAccount && userAccount.company_id) {
          companyId = userAccount.company_id;
        }
      } catch (accountError) {
        console.error("Error fetching user account:", accountError);
        // Tiếp tục với companyId = null nếu không tìm thấy account
      }

      // ✅ Tạo bản ghi thanh toán (lưu tất cả invoice IDs và companyId)
      const newPayment = new Payment({
        madeBy: userId,
        type: "charging",
        invoice_ids: invoiceIdArray, // Lưu tất cả invoice IDs vào array
        companyId: companyId, // Lưu company_id từ account (null nếu không có)
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
              final_amount: 0, // ✅ Đã thanh toán xong, final_amount = 0
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

      // Redirect về app
      return res.redirect(
        `evchargingapp://payment/return?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${Number(queryParams.vnp_Amount) / 100}&invoiceCount=${
          invoiceIdArray.length
        }&invoiceIds=${invoiceIdArray.join(",")}&type=charging`
      );
    }

    // ❌ Hash sai hoặc không thành công - redirect về app
    console.warn("VNPay signature mismatch or failed payment");
    return res.redirect(
      `evchargingapp://payment/return?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}&type=charging`
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay cho charging:", error);
    // Redirect về app
    return res.redirect(
      `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment return"
      )}&type=charging`
    );
  }
};

// ============== PAY FOR CHARGING NO VNPAY (BACKUP API) ==============
/**
 * Backup payment API for charging without VNPay
 * This function performs the same operations as payForCharging but without VNPay integration
 * It directly confirms the payment and updates invoice status
 */
exports.payForChargingNoVnpay = async (req, res) => {
  try {
    const { invoiceId, invoiceIds, amount, userId } = req.body;

    // Support both single invoiceId and array invoiceIds
    let invoiceIdArray = [];
    if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      invoiceIdArray = invoiceIds;
    } else if (invoiceId) {
      invoiceIdArray = [invoiceId];
    }

    // Validate required fields
    if (invoiceIdArray.length === 0 || !amount || !userId) {
      return res.redirect(
        `evchargingapp://payment/return?status=failed&responseMessage=${encodeURIComponent(
          "Missing required fields: invoiceId/invoiceIds (array), amount, userId"
        )}&type=charging`
      );
    }

    // Generate transaction reference
    const txnRef = Date.now().toString();
    const transactionNo = `NO-VNPAY-${txnRef}`;

    // Create order info string (same format as VNPay version)
    const orderInfo = new URLSearchParams({
      invoiceIds: invoiceIdArray.join(","), // Convert array to comma-separated string
      userId,
      type: "charging",
    }).toString();

    // Import Invoice model
    const Invoice = require("../models/Invoice");

    try {
      // ✅ Get company_id from user account
      let companyId = null;
      try {
        const userAccount = await Account.findById(userId).select("company_id");
        if (userAccount && userAccount.company_id) {
          companyId = userAccount.company_id;
        }
      } catch (accountError) {
        console.error("Error fetching user account:", accountError);
        // Continue with companyId = null if account not found
      }

      // ✅ Create payment record with fixed type = "charging"
      const newPayment = new Payment({
        madeBy: userId,
        type: "charging", // Fixed type
        invoice_ids: invoiceIdArray, // Save all invoice IDs in array
        companyId: companyId, // Save company_id from account (null if not found)
        vnp_TxnRef: txnRef,
        vnp_Amount: amount,
        vnp_OrderInfo: orderInfo,
        vnp_TransactionNo: transactionNo,
        vnp_BankCode: "NO_VNPAY", // Fixed value for non-VNPay payment
        vnp_CardType: "NO_VNPAY", // Fixed value
        vnp_PayDate: dateFormat(new Date()),
        vnp_ResponseCode: "00", // Success code
        vnp_TransactionStatus: "00", // Success status
        vnp_SecureHash: null, // No hash for non-VNPay payment
      });
      await newPayment.save();

      // ✅ Update payment_status for all invoices in array
      try {
        await Invoice.updateMany(
          { _id: { $in: invoiceIdArray } },
          {
            $set: {
              payment_status: "paid",
              payment_date: new Date(),
              transaction_id: transactionNo,
              final_amount: 0, // ✅ Payment completed, final_amount = 0
            },
          }
        );
        console.log(
          `✅ Đã cập nhật payment_status cho ${invoiceIdArray.length} invoice(s) (không qua VNPay) - Payment confirmed`
        );
      } catch (invoiceError) {
        console.error(
          "❌ Lỗi khi cập nhật invoice payment_status:",
          invoiceError
        );
        // Throw error to prevent inconsistent state
        throw invoiceError;
      }

      console.log(
        "✅ Đã tạo Payment mới cho charging (không qua VNPay) - Payment confirmed"
      );

      // Redirect về app - success
      return res.redirect(
        `evchargingapp://payment/return?status=success&txnRef=${txnRef}&transactionNo=${transactionNo}&amount=${amount}&invoiceCount=${
          invoiceIdArray.length
        }&invoiceIds=${invoiceIdArray.join(",")}&type=charging`
      );
    } catch (error) {
      console.error("❌ Lỗi trong payForChargingNoVnpay:", error);
      // Redirect về app - error
      return res.redirect(
        `evchargingapp://payment/return?status=error&txnRef=${txnRef}&message=${encodeURIComponent(
          error.message || "Error processing payment"
        )}&type=charging`
      );
    }
  } catch (error) {
    console.error("❌ Lỗi trong payForChargingNoVnpay:", error);
    // Redirect về app - error
    return res.redirect(
      `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment"
      )}&type=charging`
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

      // Redirect về app
      return res.redirect(
        `evchargingapp://payment/return?status=success&txnRef=${txnRef}&transactionNo=${
          queryParams.vnp_TransactionNo
        }&amount=${Number(queryParams.vnp_Amount) / 100}&type=base_fee${
          booking_id ? `&booking_id=${booking_id}` : ""
        }`
      );
    }

    // ❌ Hash sai hoặc không thành công - redirect về app
    console.warn("VNPay signature mismatch or failed payment");
    return res.redirect(
      `evchargingapp://payment/return?status=failed&txnRef=${txnRef}&responseCode=${
        queryParams.vnp_ResponseCode || ""
      }&responseMessage=${encodeURIComponent(
        queryParams.vnp_ResponseMessage || "Payment failed"
      )}&type=base_fee`
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay cho base_fee:", error);
    // Redirect về app
    return res.redirect(
      `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment return"
      )}&type=base_fee`
    );
  }
};

// ============== PAY FOR BASE FEE NO VNPAY (BACKUP API) ==============
/**
 * Backup payment API for base fee without VNPay
 * This function performs the same operations as payForBaseFee but without VNPay integration
 * It directly confirms the payment and calls confirm booking API if booking_id is provided
 */
exports.payForBaseFeeNoVnpay = async (req, res) => {
  try {
    const { userId, amount, booking_id } = req.body;

    // Validate required fields
    if (!amount || !userId) {
      return res.redirect(
        `evchargingapp://payment/return?status=failed&responseMessage=${encodeURIComponent(
          "Missing required fields: amount, userId"
        )}&type=base_fee`
      );
    }

    // Generate transaction reference
    const txnRef = Date.now().toString();
    const transactionNo = `NO-VNPAY-${txnRef}`;

    // Create order info string (same format as VNPay version)
    const orderInfoParams = {
      userId,
      type: "base_fee",
    };

    if (booking_id) {
      orderInfoParams.booking_id = booking_id;
    }

    const orderInfo = new URLSearchParams(orderInfoParams).toString();

    try {
      // ✅ Create payment record with fixed type = "base_fee"
      const newPayment = new Payment({
        madeBy: userId,
        type: "base_fee", // Fixed type
        vnp_TxnRef: txnRef,
        vnp_Amount: amount,
        vnp_OrderInfo: orderInfo,
        vnp_TransactionNo: transactionNo,
        vnp_BankCode: "NO_VNPAY", // Fixed value for non-VNPay payment
        vnp_CardType: "NO_VNPAY", // Fixed value
        vnp_PayDate: dateFormat(new Date()),
        vnp_ResponseCode: "00", // Success code
        vnp_TransactionStatus: "00", // Success status
        vnp_SecureHash: null, // No hash for non-VNPay payment
      });
      await newPayment.save();

      console.log(
        "✅ Đã tạo Payment mới cho base_fee (không qua VNPay) - Payment confirmed"
      );

      // ✅ Call confirm booking API if booking_id is provided
      if (booking_id) {
        try {
          // Extract base URL from request or environment
          let baseUrl;
          if (process.env.VNPAY_RETURN_URL) {
            const returnUrl = process.env.VNPAY_RETURN_URL;
            // If VNPAY_RETURN_URL is full URL with path, extract base URL
            try {
              const urlObj = new URL(returnUrl);
              baseUrl = `${urlObj.protocol}//${urlObj.host}`;
            } catch (e) {
              // If not valid URL, use directly
              baseUrl = returnUrl.replace(/\/api\/payment\/.*$/, "");
            }
          } else {
            // Fallback: use from request
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
          // Don't throw error, payment is successful, just log booking confirmation error
        }
      }

      // Redirect về app - success
      return res.redirect(
        `evchargingapp://payment/return?status=success&txnRef=${txnRef}&transactionNo=${transactionNo}&amount=${amount}&type=base_fee${
          booking_id ? `&booking_id=${booking_id}` : ""
        }`
      );
    } catch (error) {
      console.error("❌ Lỗi trong payForBaseFeeNoVnpay:", error);
      // Redirect về app - error
      return res.redirect(
        `evchargingapp://payment/return?status=error&txnRef=${txnRef}&message=${encodeURIComponent(
          error.message || "Error processing payment"
        )}&type=base_fee`
      );
    }
  } catch (error) {
    console.error("❌ Lỗi trong payForBaseFeeNoVnpay:", error);
    // Redirect về app - error
    return res.redirect(
      `evchargingapp://payment/return?status=error&message=${encodeURIComponent(
        error.message || "Error processing payment"
      )}&type=base_fee`
    );
  }
};
