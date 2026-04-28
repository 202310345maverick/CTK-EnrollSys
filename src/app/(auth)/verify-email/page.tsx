"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type VerificationState = "idle" | "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const { toast } = useToast();

  const [state, setState] = useState<VerificationState>("idle");
  const [message, setMessage] = useState("");

  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyByToken = async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        return;
      }

      setState("verifying");
      setMessage("Verifying your email...");

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Verification failed");
        }

        setState("success");
        setMessage(result.message || "Email verified successfully.");
      } catch (error) {
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify email. Please request a new verification message."
        );
      }
    };

    void verifyByToken();
  }, []);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resendEmail,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend verification");
      }

      toast({
        variant: "success",
        title: "Verification sent",
        description: result.message,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Resend failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to resend verification message.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-xl space-y-4">
        <Card className="shadow-xl border-t-4 border-t-maroon">
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
            <CardTitle className="text-xl text-maroon">Account Verification</CardTitle>
            <CardDescription>
              Verify your account by opening the email link we sent you.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {state === "verifying" && (
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{message}</span>
              </div>
            )}

            {state === "success" && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>{message}</span>
              </div>
            )}

            {state === "error" && (
              <div className="flex items-center justify-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-semibold">Resend verification message</p>
              <div className="space-y-2">
                <Label htmlFor="resendEmail">Email</Label>
                <Input
                  id="resendEmail"
                  type="email"
                  value={resendEmail}
                  onChange={(event) => setResendEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isResending}
                />
              </div>

              <Button type="submit" variant="outline" className="w-full" disabled={isResending}>
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend verification"
                )}
              </Button>
            </form>

            <Link href="/login">
              <Button className="w-full bg-maroon hover:bg-maroon-dark text-white">
                Continue to sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
