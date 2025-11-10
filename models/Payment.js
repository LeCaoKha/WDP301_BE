const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  madeBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  type: {
    type: String,
    enum: ["subscription", "charging", "base_fee"],
  },
  invoice_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Invoice",
    default: [],
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null,
  },
  vehicleSubscriptionIdId: String,
  vnp_TxnRef: String,
  vnp_Amount: Number,
  vnp_OrderInfo: String,
  vnp_TransactionNo: String,
  vnp_BankCode: String,
  vnp_CardType: String,
  vnp_PayDate: String,
  vnp_ResponseCode: String,
  vnp_TransactionStatus: String,
  vnp_SecureHash: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
