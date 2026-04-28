import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/db/connection";
import User, { IUser } from "@/models/User";
import { registerSchema } from "@/validations/auth";
import { EMAIL_VERIFICATION_TOKEN_TTL_MINUTES } from "@/lib/auth/constants";
import { createSecureToken } from "@/lib/auth/token";
import {
  assertAuthEmailConfig,
  buildVerifyEmailUrl,
  sendVerificationEmail,
} from "@/lib/auth/email";

function getVerificationMessage(): string {
  return "Registration successful. Please check your email and click the verification link before signing in.";
}

async function sendVerificationChallenge(user: IUser) {
  const { rawToken, hashedToken, expiresAt } = createSecureToken(
    EMAIL_VERIFICATION_TOKEN_TTL_MINUTES
  );
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expiresAt;
  await user.save();

  const verificationUrl = buildVerifyEmailUrl(rawToken);
  await sendVerificationEmail({
    email: user.email,
    name: user.profile.firstName,
    verificationUrl,
    expiresInMinutes: EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid registration payload" },
        { status: 400 }
      );
    }

    assertAuthEmailConfig();

    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      contactNumber,
      address,
    } = parsed.data;

    await dbConnect();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }

      existingUser.password = await bcrypt.hash(password, 12);
      existingUser.profile.firstName = firstName;
      existingUser.profile.lastName = lastName;
      existingUser.profile.middleName = middleName || undefined;
      existingUser.profile.contactNumber = contactNumber;
      existingUser.profile.address = address || undefined;
      existingUser.failedLoginAttempts = 0;
      existingUser.lockoutUntil = undefined;

      try {
        await sendVerificationChallenge(existingUser);
      } catch (emailError) {
        console.error("Verification resend failed:", emailError);
        return NextResponse.json(
          { error: "Unable to send verification email. Please try again later." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message:
            "Your account is already registered but not verified. A new verification link has been sent to your email.",
        },
        { status: 200 }
      );
    }

    const user = await User.create({
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: "parent",
      profile: {
        firstName,
        lastName,
        middleName: middleName || undefined,
        contactNumber,
        address: address || undefined,
      },
      isActive: true,
      isEmailVerified: false,
      failedLoginAttempts: 0,
    });

    try {
      await sendVerificationChallenge(user);
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      console.error("Verification email sending failed:", emailError);
      return NextResponse.json(
        { error: "Unable to send verification email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: getVerificationMessage(),
        user: {
          id: user._id,
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
