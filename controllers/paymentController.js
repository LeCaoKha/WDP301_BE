const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/Payment");
const Vehicle = require("../models/Vehicle");
const VehicleSubscription = require("../models/VehicleSubscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");

const url = require("url");
const querystring = require("querystring");
const { findById } = require("../models/Vehicle");
const tmnCode = "MTZVDR2T";
const secureSecret = "C70JGHY1X7BQ2B98HO2S7X9BNLQ4JGDX";

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
    const txnRef = req.params.vehicleSubscriptionId; // txnRef truyền ở URL

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
          `evchargingapp://payment-failed?txnRef=${txnRef}&error=plan_not_found`
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

      return res.redirect(
        // `http://localhost:5173/vnpay/return?status=success&vehicleSubscriptionId=${vehicleSubscription._id}`
        `evchargingapp://vnpay/return?status=success&vehicleSubscriptionId=${vehicleSubscription._id}`
      );
    }

    // ❌ Hash sai hoặc không thành công
    console.warn("VNPay signature mismatch or failed payment");
    return res.redirect(`evchargingapp://payment-failed?txnRef=${txnRef}`);
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay:", error);
    return res.status(500).json({ message: "Lỗi xử lý kết quả thanh toán" });
  }
};

exports.payForCharging = async (req, res) => {
  try {
    const { invoiceId, amount, userId } = req.body;

    if (!invoiceId || !amount || !userId) {
      return res.status(400).json({
        message: "Missing required fields: invoiceId, amount, userId",
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

    // 👇 Gửi dữ liệu cần thiết trong vnp_OrderInfo
    const orderInfo = new URLSearchParams({
      invoiceId,
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

      const { invoiceId, userId } = parsedInfo;

      // ✅ Tạo bản ghi thanh toán
      const newPayment = new Payment({
        madeBy: userId,
        type: "charging",
        invoice_id: invoiceId,
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
        "✅ Đã tạo Payment mới cho charging sau thanh toán thành công"
      );

      return res.redirect(
        `evchargingapp://vnpay/return?status=success&invoiceId=${invoiceId}&txnRef=${txnRef}`
      );
    }

    // ❌ Hash sai hoặc không thành công
    console.warn("VNPay signature mismatch or failed payment");
    return res.redirect(`evchargingapp://payment-failed?txnRef=${txnRef}`);
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay cho charging:", error);
    return res.status(500).json({ message: "Lỗi xử lý kết quả thanh toán" });
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

      return res.redirect(
        `evchargingapp://vnpay/return?status=success&type=base_fee&txnRef=${txnRef}${
          booking_id ? `&booking_id=${booking_id}` : ""
        }`
      );
    }

    // ❌ Hash sai hoặc không thành công
    console.warn("VNPay signature mismatch or failed payment");
    return res.redirect(`evchargingapp://payment-failed?txnRef=${txnRef}`);
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay cho base_fee:", error);
    return res.status(500).json({ message: "Lỗi xử lý kết quả thanh toán" });
  }
};
