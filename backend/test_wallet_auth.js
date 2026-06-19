import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const JWT_SECRET =
  process.env.JWT_SECRET || "returno-enterprise-secure-jwt-key-2026";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/druto-clone";

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const customerSchema = new mongoose.Schema(
    {
      email: String,
      role: String,
      name: String,
    },
    { strict: false },
  );

  const Customer =
    mongoose.models.Customer || mongoose.model("Customer", customerSchema);

  const customer = await Customer.findOne();
  if (!customer) {
    console.log("No customer found in database");
    await mongoose.disconnect();
    return;
  }

  // Generate token
  const token = jwt.sign(
    {
      id: customer._id.toString(),
      email: customer.email,
      role: customer.role,
      name: customer.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  console.log("Generated Valid Token:", token);
  console.log("Token Length:", token.length);

  console.log("Fetching Next.js /wallet using valid token...");
  try {
    const res = await fetch("http://localhost:3000/wallet", {
      headers: {
        Cookie: `token=${token}`,
      },
    });
    console.log("Next.js Response Status:", res.status);

    // Read response text/headers to see if it redirects or renders
    const text = await res.text();
    if (text.includes("NEXT_REDIRECT")) {
      console.log("Next.js redirected!");
      // Find redirect URL in text
      const match =
        text.match(/redirect;([^\s;]+)/i) || text.match(/\/auth\?expired=true/);
      console.log("Redirect match:", match ? match[0] : "Not found");
    } else {
      console.log("Next.js returned HTML successfully! (No redirect)");
    } 
  } catch (err) {
    console.error("Fetch to Next.js failed:", err);
  }

  await mongoose.disconnect();
}

test().catch(console.error);
