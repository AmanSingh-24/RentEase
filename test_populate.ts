import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Property from "./app/api/models/Property"; // No, it's ./models/Property

dotenv.config({ path: ".env.local" });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const property = await mongoose.models.Property.findOne({ "pastTenants.0": { $exists: true } })
    .populate("pastTenants.tenantId", "name email kycDetails");
  
  if (property) {
    console.log(JSON.stringify(property.pastTenants, null, 2));
  } else {
    console.log("No property with past tenants found.");
  }
  process.exit();
}

run();
