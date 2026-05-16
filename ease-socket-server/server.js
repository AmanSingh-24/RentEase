const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// 🌐 Configure CORS to let your Next.js Frontend connect securely
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 💾 Shared MongoDB Connection Setup
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rentease";
mongoose.connect(MONGO_URI)
  .then(() => console.log("💾 Socket Server linked to MongoDB Vault successfully."))
  .catch(err => console.error("❌ MongoDB link failure:", err));

// 🛠️ Inline Message Schema Definition for Server Independence
const Message = mongoose.model("Message", new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  receiverId: mongoose.Schema.Types.ObjectId,
  propertyId: mongoose.Schema.Types.ObjectId,
  messageText: String,
  messageType: { type: String, enum: ["direct", "broadcast"], default: "direct" },
  isRead: { type: Boolean, default: false }
}, { timestamps: true }));

// ⚡ WebSocket Connection Lifecycle Handler
io.on("connection", (socket) => {
  console.log(`🔌 Channel established for device: ${socket.id}`);

  // 🚪 Step 1: Active 1-to-1 Room Mapping Handshake
  socket.on("join_property_room", (data) => {
    const { propertyId } = data;
    socket.join(propertyId.toString());
    console.log(`🏠 Socket ${socket.id} tuned into Property Frequency: ${propertyId}`);
  });

  // 📢 Step 2: Background Landlord Broadcast Room Mapping Handshake
  socket.on("join_broadcast_channel", (data) => {
    const { ownerId } = data;
    socket.join(`broadcast_channel_${ownerId}`);
    console.log(`📡 Tenant Socket ${socket.id} listening to Landlord Broadcast Frequency: ${ownerId}`);
  });

  // 💬 Step 3: Handle 1-to-1 Live Messages
  socket.on("send_direct_message", async (data) => {
    const { senderId, receiverId, propertyId, messageText } = data;

    try {
      // Persistence: Write immediately to MongoDB
      const savedMessage = await Message.create({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: receiverId ? new mongoose.Types.ObjectId(receiverId) : null,
        propertyId: new mongoose.Types.ObjectId(propertyId),
        messageText,
        messageType: "direct"
      });

      // Emission: Flash the message directly to everyone inside that property room
      io.to(propertyId.toString()).emit("receive_message", savedMessage);
    } catch (err) {
      console.error("❌ Message processing error:", err);
    }
  });

  // 📣 Step 4: Handle Landlord Broadcast Transmission
  socket.on("send_owner_broadcast", async (data) => {
    const { ownerId, propertyIds, messageText } = data;

    try {
      // Loop through all properties selected by the owner to log individual message instances
      const broadcastPromises = propertyIds.map(async (propId) => {
        return Message.create({
          senderId: new mongoose.Types.ObjectId(ownerId),
          propertyId: new mongoose.Types.ObjectId(propId),
          messageText,
          messageType: "broadcast"
        });
      });

      await Promise.all(broadcastPromises);

      // Flash the live message directly down the owner's specific broadcast channel
      io.to(`broadcast_channel_${ownerId}`).emit("receive_broadcast", {
        senderId: ownerId,
        messageText,
        messageType: "broadcast",
        createdAt: new Date()
      });
      
      console.log(`📢 Broadcast sent to channel: broadcast_channel_${ownerId}`);
    } catch (err) {
      console.error("❌ Broadcast execution failed:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Connection severed for device: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Standalone Real-Time Hub running on port ${PORT}`));