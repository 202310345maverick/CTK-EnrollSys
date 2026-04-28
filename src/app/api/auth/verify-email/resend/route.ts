import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/db/connection";
import User from "@/models/User";
import { resendVerificationSchema } from "@/validations/auth";
import { EMAIL_VERIFICATION_TOKEN_TTL_MINUTES } from "@/lib/auth/constants";
import { createSecureToken } from "@/lib/auth/token";
import {
  assertAuthEmailConfig,
  buildVerifyEmailUrl,
  sendVerificationEmail,
} from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
        { status: 400 }
      );
    }

    assertAuthEmailConfig();
    await dbConnect();

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists and is not yet verified, a new verification message has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: "This account is already verified. You can sign in now." },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      message: "A new verification link has been sent to your email address.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
