import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["deposit", "rent"], required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  
  // Financial Breakdown
  baseRent: { type: Number, required: true },
  penaltyApplied: { type: Number, default: 0 },
  maintenanceCredit: { type: Number, default: 0 },
  totalAmountPaid: { type: Number, required: true }, // The final figure
  
  gatewayTransactionId: { type: String, required: true },
  status: { type: String, default: "completed" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);