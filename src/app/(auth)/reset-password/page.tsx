"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { resetPasswordSchema, ResetPasswordInput } from "@/validations/auth";

type TokenState = "checking" | "valid" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const validateToken = async () => {
      const tokenFromUrl = new URLSearchParams(window.location.search).get("token");
      setToken(tokenFromUrl);

      if (!tokenFromUrl) {
        setTokenState("invalid");
        setTokenError("Missing reset token.");
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(tokenFromUrl)}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Invalid reset token");
        }

        setTokenState("valid");
      } catch (error) {
        setTokenState("invalid");
        setTokenError(
          error instanceof Error
            ? error.message
            : "This reset link is invalid or has expired."
        );
      }
    };

    void validateToken();
  }, []);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast({
        variant: "success",
        title: "Password updated",
        description: result.message,
      });

      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-maroon">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/ctk.png"
              alt="CTK Logo"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full bg-white object-contain p-1 shadow"
            />
          </div>
          <CardTitle className="text-xl text-maroon">Reset Password</CardTitle>
          <CardDescription>
            Set a new password for your CTK EnrollSys account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenState === "checking" && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating reset link...
            </div>
          )}

          {tokenState === "invalid" && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-destructive">
                {tokenError ?? "This reset link is invalid or has expired."}
              </p>
              <Link href="/forgot-password">
                <Button className="w-full bg-maroon hover:bg-maroon-dark text-white">
                  Request a new reset link
                </Button>
              </Link>
            </div>
          )}

          {tokenState === "valid" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  disabled={isLoading}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  disabled={isLoading}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-maroon hover:bg-maroon-dark text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
