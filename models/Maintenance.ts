import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Structured Location
  roomName: { type: String, required: true },
  itemName: { type: String, required: true },
  
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["reported", "owner_review", "tenant_led_fix", "owner_led_fix", "resolved", "rejected"], 
    default: "reported" 
  },
  
  // 📸 Evidence
  issueImages: [{ url: String, timestamp: { type: Date, default: Date.now } }],
  finalInvoice: { url: String, amount: Number }, // Proof of payment for ledger

  // ⚖️ Triage Logic (The Brain)
  estimatedCost: { type: Number, default: 0 },
  responsibility: { type: String, enum: ["owner", "tenant", "disputed"], default: "tenant" },
  causation: { 
    type: String, 
    enum: ["wear_and_tear", "tenant_negligence", "pre_existing", "emergency"],
    default: "wear_and_tear" 
  },
  
  // Owner's Action
  approvedBudget: { type: Number, default: 0 },
  contractorInfo: {
    name: String,
    contact: String,
    arrival: String
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Maintenance || mongoose.model("Maintenance", MaintenanceSchema);