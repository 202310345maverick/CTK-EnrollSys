"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { loginSchema, LoginInput } from "@/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasShownContextToast = useRef(false);

  useEffect(() => {
    if (hasShownContextToast.current) {
      return;
    }

    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "session-expired") {
      hasShownContextToast.current = true;
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "You were signed out due to inactivity. Please sign in again.",
      });
    }
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.error,
        });
      } else {
        toast({
          variant: "success",
          title: "Login Successful",
          description: "Redirecting to dashboard...",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-maroon to-maroon-dark p-8 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/images/ctk.png" alt="CTK Logo" width={48} height={48} className="h-12 w-12 rounded-full bg-white object-contain p-1" />
            <div>
              <h1 className="text-2xl font-bold text-white">Christ the King</h1>
              <p className="text-gold text-sm">Catholic School</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white leading-tight">
            Welcome Back to<br />CTK EnrollSys
          </h2>
          <p className="text-white/80 max-w-sm">
            Sign in to continue managing enrollment and student records securely.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-gold text-xs">✓</span>
              </div>
              <span>Enrollment tracking dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-gold text-xs">✓</span>
              </div>
              <span>Student records management</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-gold text-xs">✓</span>
              </div>
              <span>Secure and role-based access</span>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-sm">© 2026 Christ the King Catholic School</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-6 relative">
        <Image src="/images/ctkbackground.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-maroon relative z-10 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-1">
            <div className="lg:hidden flex justify-center mb-4">
              <Image src="/images/ctk.png" alt="CTK Logo" width={64} height={64} className="h-16 w-16 rounded-full bg-white object-contain p-1 shadow" />
            </div>
            <CardTitle className="text-xl text-maroon">Sign In</CardTitle>
            <CardDescription>Use your account credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-10 pl-10"
                    {...register("email")}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="password" className="font-semibold text-slate-700">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-10 pl-10 pr-10"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full h-10 bg-maroon hover:bg-maroon-dark text-white font-medium mt-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-muted-foreground text-sm mb-2">
                Didn&apos;t receive verification?{" "}
                <Link href="/verify-email" className="text-maroon hover:underline font-medium">
                  Verify account
                </Link>
              </p>
              <p className="text-muted-foreground text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-maroon hover:underline font-medium">
                  Register
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
