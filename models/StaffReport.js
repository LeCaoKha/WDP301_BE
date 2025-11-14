const mongoose = require("mongoose");

const staffReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      default: null,
    },
    images: [
      {
        imageUrl: {
          type: String,
          required: true,
        },
        imagePublicId: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "processing", "resolved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StaffReport", staffReportSchema);
