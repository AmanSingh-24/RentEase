import mongoose from "mongoose";
import "@/models/User";
import "@/models/Property";
import "@/models/Notification";
import "@/models/Booking";
import "@/models/Payment";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  
  // Safely drop leftover inviteCode_1 index if present in DB
  try {
    const db = cached.conn.connection.db;
    if (db) {
      const collections = await db.listCollections({ name: "properties" }).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection("properties").indexes();
        if (indexes.some((idx: any) => idx.name === "inviteCode_1")) {
          await db.collection("properties").dropIndex("inviteCode_1");
          console.log("🧹 Cleaned up stale 'inviteCode_1' index from properties collection.");
        }
      }
    }
  } catch (err) {
    // Ignore if already dropped
  }

  return cached.conn;
}

export default connectToDatabase;