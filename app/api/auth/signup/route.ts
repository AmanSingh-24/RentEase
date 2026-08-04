import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email, password } = body;

    // Basic input validation
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Name, email and password are all required." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "pending",
    });

    return NextResponse.json({ message: "User created!", userId: newUser._id }, { status: 201 });
  } catch (error: any) {
    // Log the real error so we can see what's actually failing
    console.error("SIGNUP_ERROR:", error?.message || error);

    // Handle MongoDB duplicate key error (race condition between findOne and create)
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Signup failed. Please try again." },
      { status: 500 }
    );
  }
}