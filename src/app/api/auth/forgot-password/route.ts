import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/validations/auth";
import { PASSWORD_RESET_TOKEN_TTL_MINUTES } from "@/lib/auth/constants";
import { createSecureToken } from "@/lib/auth/token";
import {
  assertAuthEmailConfig,
  buildResetPasswordUrl,
  sendPasswordResetEmail,
} from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
        { status: 400 }
      );
    }

    assertAuthEmailConfig();
    await dbConnect();

    const email = parsed.data.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (user) {
      const { rawToken, hashedToken, expiresAt } = createSecureToken(
        PASSWORD_RESET_TOKEN_TTL_MINUTES
      );

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = expiresAt;
      await user.save();

      const resetUrl = buildResetPasswordUrl(rawToken);

      await sendPasswordResetEmail({
        email: user.email,
        name: user.profile.firstName,
        resetUrl,
        expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
      });
    }

    return NextResponse.json({
      message:
        "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process forgot password request" },
      { status: 500 }
    );
  }
}
