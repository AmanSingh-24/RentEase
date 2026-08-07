import mongoose from "mongoose";

const FinancialAdjustmentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  month: { type: String, required: true },
  year: { type: Number, required: true },
  
  // Toggles and Adjustments
  isLateFeeWaived: { type: Boolean, default: false },
  customCredit: { type: Number, default: 0 },
  customPenalty: { type: Number, default: 0 },
  
  // Tracking when a nudge was last sent to prevent spam
  lastNudgedAt: { type: Date },
  nudgeHistory: [{ type: Date }], // For tracking 3 nudges within 24 hours
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.FinancialAdjustment || mongoose.model("FinancialAdjustment", FinancialAdjustmentSchema);
