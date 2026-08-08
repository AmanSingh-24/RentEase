import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PaymentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["deposit", "rent", "refund"], required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  baseRent: { type: Number, required: true },
  penaltyApplied: { type: Number, default: 0 },
  maintenanceCredit: { type: Number, default: 0 },
  totalAmountPaid: { type: Number, required: true },
  gatewayTransactionId: { type: String, required: true },
  paymentMethod: { type: String, enum: ["razorpay", "manual", "zero_settlement"], default: "razorpay" },
  status: { type: String, default: "completed" },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const payment = new Payment({
      propertyId: new mongoose.Types.ObjectId(),
      tenantId: new mongoose.Types.ObjectId(),
      type: "refund",
      month: "Aug",
      year: 2026,
      baseRent: 0,
      totalAmountPaid: 1000,
      gatewayTransactionId: "TEST_TXN",
      paymentMethod: "razorpay",
      status: "completed"
    });
    await payment.validate();
    console.log("Validation passed");
  } catch (err) {
    console.error("Validation error:", err);
  }
  process.exit();
}

run();
