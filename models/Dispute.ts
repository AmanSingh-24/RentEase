import mongoose, { Schema, Document } from "mongoose";

export interface IDispute extends Document {
  title: string;
  propertyId: mongoose.Types.ObjectId;
  initiatorId: mongoose.Types.ObjectId;
  initiatorModel: "User";
  respondentId: mongoose.Types.ObjectId;
  respondentModel: "User";
  
  category: "financial" | "maintenance" | "lease_violation" | "exit_deposit" | "other";
  status: "open" | "awaiting_respondent" | "under_review_by_admin" | "resolved" | "dismissed";
  severity: "low" | "medium" | "high" | "critical";

  // Context Linking
  relatedEntityModel?: "Payment" | "Maintenance" | "ExitProcess";
  relatedEntityId?: mongoose.Types.ObjectId;

  // Claims
  initiatorClaim: {
    description: string;
    evidenceUrls: string[]; 
    requestedAmount?: number;
    submittedAt: Date;
  };
  
  respondentClaim?: {
    description: string;
    evidenceUrls: string[];
    submittedAt: Date;
  };

  // Verdict
  adminResolution?: {
    resolvedByAdminId: mongoose.Types.ObjectId;
    decisionNotes: string;
    financialAdjustmentId?: mongoose.Types.ObjectId;
    resolvedAt: Date;
    winner?: "initiator" | "respondent" | "split";
  };

  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>({
  title: { type: String, required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  initiatorId: { type: Schema.Types.ObjectId, refPath: "initiatorModel", required: true },
  initiatorModel: { type: String, enum: ["User"], required: true, default: "User" },
  respondentId: { type: Schema.Types.ObjectId, refPath: "respondentModel", required: true },
  respondentModel: { type: String, enum: ["User"], required: true, default: "User" },

  category: { 
    type: String, 
    enum: ["financial", "maintenance", "lease_violation", "exit_deposit", "other"], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["open", "awaiting_respondent", "under_review_by_admin", "resolved", "dismissed"], 
    default: "open" 
  },
  severity: { 
    type: String, 
    enum: ["low", "medium", "high", "critical"], 
    default: "medium" 
  },

  relatedEntityModel: { type: String, enum: ["Payment", "Maintenance", "ExitProcess"] },
  relatedEntityId: { type: Schema.Types.ObjectId, refPath: "relatedEntityModel" },

  initiatorClaim: {
    description: { type: String, required: true },
    evidenceUrls: [{ type: String }],
    requestedAmount: { type: Number },
    submittedAt: { type: Date, default: Date.now }
  },
  
  respondentClaim: {
    description: { type: String },
    evidenceUrls: [{ type: String }],
    submittedAt: { type: Date }
  },

  adminResolution: {
    resolvedByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
    decisionNotes: { type: String },
    financialAdjustmentId: { type: Schema.Types.ObjectId },
    resolvedAt: { type: Date },
    winner: { type: String, enum: ["initiator", "respondent", "split"] }
  }
}, { timestamps: true });

export default mongoose.models.Dispute || mongoose.model<IDispute>("Dispute", DisputeSchema);
