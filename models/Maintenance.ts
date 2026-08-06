import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  roomName: { type: String, required: true },
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ["reported", "tenant_led_fix", "owner_led_fix", "resolved", "rejected"], 
    default: "reported" 
  },
  
  issueImages: [{ url: String, timestamp: { type: Date, default: Date.now } }],
  
  // 🧾 FINANCIAL SEAL
  finalInvoice: { 
    amount: { type: Number, default: 0 }, 
    url: String, // This is the official bill OR the "After" photo
    transactionId: String // UPI or Bank Reference ID
  },
  
  // 🕵️ VERIFICATION PROTOCOL (For Local Workers)
  resolutionEvidence: {
    workerName: String,
    workerContact: String,
    repairCategory: String,
    hasOfficialBill: { type: Boolean, default: true },
    afterImage: String,
    workerVerified: { type: Boolean, default: false },
    workerVerifiedAt: Date,
  },
  isAmountApproved: { type: Boolean, default: false },

  estimatedCost: { type: Number, default: 0 },
  responsibility: { type: String, enum: ["owner", "tenant", "disputed"], default: "tenant" },
  causation: { 
    type: String, 
    enum: ["wear_and_tear", "tenant_negligence", "pre_existing", "emergency", "pro_resolved"],
    default: "wear_and_tear" 
  },
  
  contractorInfo: { name: String, contact: String, arrival: String },
  ownerFeedback: String,
  isCredited: { type: Boolean, default: false }, // Marks if this repair has been applied to a rent invoice
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Maintenance || mongoose.model("Maintenance", MaintenanceSchema);