import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional because global landlord broadcast messages don't target a single receiver
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // The house context where the message conversation lives
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    messageText: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["direct", "broadcast"],
      default: "direct",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Optimize database read speeds for conversation loading
MessageSchema.index({ propertyId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);