const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    plateNumber: { type: String, unique: true, maxlength: 20, trim: true },
    brand: { type: String, maxlength: 50, trim: true },
    model: { type: String, maxlength: 50, trim: true },
    // kWh
    batteryCapacity: { type: Number },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
