const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
      enum: ["prepaid"],
      default: "prepaid",
      description: "Type of subscription plan",
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
      description: "Name of the subscription plan",
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0,
      description: "Price of the subscription plan",
    },
    billing_cycle: {
      type: String,
      required: true,
      enum: ["monthly", "quarterly", "yearly", "one-time"],
      description: "Billing cycle for the subscription",
    },
    limit_type: {
      type: String,
      required: true,
      enum: ["vehicles", "stations", "charging_sessions", "users", "unlimited"],
      description: "Type of limit applied to the subscription",
    },
    limit_value: {
      type: Number,
      required: true,
      min: 0,
      description: "Value of the limit (0 for unlimited)",
    },
    description: {
      type: String,
      required: false,
      maxlength: 1000,
      trim: true,
      description: "Detailed description of the subscription plan",
    },
    is_active: {
      type: Boolean,
      default: true,
      description: "Whether the subscription plan is currently active",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Index for better query performance
subscriptionPlanSchema.index({ type: 1, is_active: 1 });
subscriptionPlanSchema.index({ price: 1 });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
