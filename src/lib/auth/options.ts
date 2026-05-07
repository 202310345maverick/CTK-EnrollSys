import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/connection";
import User from "@/models/User";
import { createAuditLog } from "@/lib/audit";
import {
  ACCOUNT_LOCKOUT_MINUTES,
  MAX_FAILED_LOGIN_ATTEMPTS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        await dbConnect();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Please contact the administrator.");
        }

        const now = new Date();
        if (user.lockoutUntil && user.lockoutUntil > now) {
          throw new Error(
            `Too many failed login attempts. Your account is locked for ${ACCOUNT_LOCKOUT_MINUTES} minutes.`
          );
        }

        if (user.role === "parent" && !user.isEmailVerified) {
          throw new Error("Please verify your email address before signing in.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const nextFailedAttempts = (user.failedLoginAttempts ?? 0) + 1;

          if (nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            await User.findByIdAndUpdate(user._id, {
              $set: {
                failedLoginAttempts: 0,
                lockoutUntil: new Date(Date.now() + ACCOUNT_LOCKOUT_MINUTES * 60 * 1000),
              },
            });

            throw new Error(
              `Too many failed login attempts. Your account is locked for ${ACCOUNT_LOCKOUT_MINUTES} minutes.`
            );
          }

          await User.findByIdAndUpdate(user._id, {
            $set: { failedLoginAttempts: nextFailedAttempts },
          });

          throw new Error("Invalid email or password");
        }

        await User.findByIdAndUpdate(user._id, {
          $set: {
            lastLogin: new Date(),
            failedLoginAttempts: 0,
          },
          $unset: {
            lockoutUntil: 1,
          },
        });

        void createAuditLog({
          userId: user._id.toString(),
          action: "LOGIN",
          resource: "AUTH",
          details: { email: user.email, role: user.role },
        });

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isEmailVerified = user.isEmailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
