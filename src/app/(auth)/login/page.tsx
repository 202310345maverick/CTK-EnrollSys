"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { GraduationCap, Loader2, Mail, Lock, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { loginSchema, LoginInput } from "@/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f2e9,_#ede8df)] px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl shadow-slate-900/10">
        <div className="bg-primary px-6 pb-8 pt-7 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-400 bg-white text-primary">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold leading-none">CTK EnrollSys</h1>
          <p className="mt-2 text-sm font-medium text-white/95">Christ the King Catholic School</p>
          <p className="text-sm text-white/85">Enrollment & Records Management System</p>
        </div>

        <div className="bg-[#f8f8f8] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="ctk-input pl-10"
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
                  type="password"
                  placeholder="Enter your password"
                  className="ctk-input pl-10"
                  {...register("password")}
                  disabled={isLoading}
                />
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

            <Button type="submit" className="h-11 w-full rounded-lg text-lg font-bold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Demo Credentials:</p>
            <p className="mt-1 flex items-center gap-2"><Circle className="h-2 w-2 fill-slate-500 text-slate-500" />Admin: admin@ctk.edu / admin123</p>
            <p className="flex items-center gap-2"><Circle className="h-2 w-2 fill-slate-500 text-slate-500" />Registrar: registrar@ctk.edu / registrar123</p>
            <p className="flex items-center gap-2"><Circle className="h-2 w-2 fill-slate-500 text-slate-500" />Parent: parent@example.com / parent123</p>
          </div>

          <p className="mt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
