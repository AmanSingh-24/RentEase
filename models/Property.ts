import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, 
  address: { type: String, required: true },
  inviteCode: { type: String, unique: true },
  
  // ✅ STRUCTURE: The Room-by-Item Blueprint
  // This allows the owner to define exactly what is in the house
  structure: [
    {
      roomName: { type: String, required: true }, // e.g., "Master Bedroom"
      items: [
        {
          itemName: { type: String, required: true }, // e.g., "Main Door Lock"
          description: { type: String }, // e.g., "Godrej 7-lever"
          baselineCondition: { type: String, enum: ["Good", "Fair", "Poor", "N/A"], default: "Good" }
        }
      ]
    }
  ],

  // ✅ FINTECH & RULES (Already solid, kept for consistency)
  rentAmount: { type: Number, default: 15000 },
  depositAmount: { type: Number, default: 45000 },
  leaseStartDate: { type: Date, default: Date.now },
  billingDay: { type: Number, default: 1 }, 

  maintenanceRules: {
    gracePeriodDays: { type: Number, default: 7 }, 
    repairThreshold: { type: Number, default: 500 }, 
  },
  exitPolicy: {
    lockInMonths: { type: Number, default: 11 },
    noticePeriodDays: { type: Number, default: 30 },
  },

  agreement: {
    isSignedByOwner: { type: Boolean, default: false },
    isSignedByTenant: { type: Boolean, default: false },
    signedPdfUrl: { type: String }, 
    blockchainHash: { type: String }, 
    signedAt: { type: Date }
  },

  status: { type: String, enum: ["vacant", "occupied", "under_notice"], default: "vacant" },

  activeExitId: { type: mongoose.Schema.Types.ObjectId, ref: "ExitProcess", default: null },
  
  pastTenants: [{
    tenantId: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    movedOutAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Property || mongoose.model("Property", PropertySchema);