const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const vehicleSubscription = require("../models/VehicleSubscription");
const url = require("url");
const querystring = require("querystring");
const tmnCode = "MTZVDR2T";
const secureSecret = "C70JGHY1X7BQ2B98HO2S7X9BNLQ4JGDX";

exports.getPaymentUrl = async (req, res) => {
  try {
    const { amount, vehicleSubscriptionId, userId } = req.body;
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

    const txnRef = Date.now().toString(); // Tạo mã giao dịch duy nhất

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: amount, // 1000 VNĐ = 100000
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `subcriptionId=${vehicleSubscriptionId}&userId=${userId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `http://localhost:5000/api/payment/return/${vehicleSubscriptionId}`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    // Gợi ý: lưu txnRef vào DB để phục vụ cho refund sau này
    res.status(201).json(vnpayResponse);
  } catch (error) {
    console.error("Error in getPaymentUrl:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    const vehicleSubscriptionId = req.params.vehicleSubscriptionId;
    // Lấy raw query string (KHÔNG decode)
    const rawUrl = req.originalUrl || req.url;
    const parsedUrl = url.parse(rawUrl);
    const rawQuery = parsedUrl.query || "";

    console.log("vehicleSubId: ", vehicleSubscriptionId);
    console.log("rawUrl: ", rawUrl);
    console.log("parsedUrl: ", parsedUrl);
    console.log("rawQuery: ", rawQuery);

    if (!rawQuery) {
      console.warn("No raw query string found on return URL");
    }

    // Parse thành object nhưng KHÔNG decode (giữ nguyên encoding từ VNPay)
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

    // Nếu vnp_OrderInfo tồn tại -> decode và parse chi tiết để lấy userId
    let userId;
    if (queryParams.vnp_OrderInfo) {
      try {
        const decodedOrderInfo = decodeURIComponent(queryParams.vnp_OrderInfo);
        const parsedInfo = Object.fromEntries(
          new URLSearchParams(decodedOrderInfo)
        );
        userId = parsedInfo.userId;
      } catch (e) {
        console.warn("Failed to decode/parse vnp_OrderInfo:", e);
      }
    }

    const secureHash = queryParams["vnp_SecureHash"];
    // loại bỏ các trường không tham gia tạo chữ ký
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

    // So sánh hash không phân biệt hoa thường để tránh mismatch do case
    if (
      computedHash.toLowerCase() === String(secureHash || "").toLowerCase() &&
      queryParams.vnp_ResponseCode === "00"
    ) {
      const newPayment = new Payment({
        madeBy: userId,
        type: "subcription",
        vehicleSubscriptionId: vehicleSubscriptionId,
        vnp_TxnRef: queryParams.vnp_TxnRef,
        vnp_Amount: Number(queryParams.vnp_Amount) / 100,
        vnp_OrderInfo: queryParams.vnp_OrderInfo
          ? decodeURIComponent(queryParams.vnp_OrderInfo)
          : undefined,
        vnp_TransactionNo: queryParams.vnp_TransactionNo,
        vnp_BankCode: queryParams.vnp_BankCode,
        vnp_CardType: queryParams.vnp_CardType,
        vnp_PayDate: queryParams.vnp_PayDate,
        vnp_ResponseCode: queryParams.vnp_ResponseCode,
        vnp_TransactionStatus: queryParams.vnp_TransactionStatus,
        vnp_SecureHash: secureHash,
      });
      await newPayment.save();

      const updatedApp = await vehicleSubscription.findByIdAndUpdate(
        vehicleSubscriptionId,
        { payment_status: "paid" },
        { new: true }
      );

      if (!updatedApp) {
        console.warn("⚠️ Không tìm thấy đơn để cập nhật");
      } else {
        console.log("✅ Đã cập nhật đơn thành payment_completed");
      }

      return res.redirect(
        `http://localhost:5173/vnpay/return?vehicleSubcriptionId=${vehicleSubscriptionId}`
      );
    }

    // debug khi hash mismatch
    console.warn("VNPay signature mismatch or non-success response", {
      computedHash,
      receivedHash: secureHash,
      responseCode: queryParams.vnp_ResponseCode,
      signData,
    });

    return res.redirect(
      `http://localhost:5173/payment-failed?applicationId=${vehicleSubscriptionId}`
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý return từ VNPay:", error);
    return res.status(500).json({ message: "Lỗi xử lý kết quả thanh toán" });
  }
};
