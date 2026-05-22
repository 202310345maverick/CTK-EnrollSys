"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { registerSchema, RegisterInput } from "@/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      toast({
        title: "Registration Successful",
        description: result.message || "Your account has been created.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Left Panel - Branding (hidden on mobile) */}
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
            Join Our<br />School Community
          </h2>
          <p className="text-white/80 max-w-sm">
            Create your parent account to start the enrollment process for your children.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-gold text-xs">✓</span>
              </div>
              <span>Online enrollment application</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-gold text-xs">✓</span>
              </div>
              <span>Real-time status tracking</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-gold text-xs">✓</span>
              </div>
              <span>Secure document upload</span>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-sm">
          © 2026 Christ the King Catholic School
        </p>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6 relative bg-[url('/images/ctkbackground.png')] bg-cover bg-center overflow-y-auto">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <Card className="w-full max-w-3xl shadow-2xl border-t-4 border-t-maroon relative z-10 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-1">
            <div className="lg:hidden flex justify-center mb-4">
              <Image src="/images/ctk.png" alt="CTK Logo" width={64} height={64} className="h-16 w-16 rounded-full bg-white object-contain p-1 shadow" />
            </div>
            <CardTitle className="text-xl text-maroon">Create Account</CardTitle>
            <CardDescription>Register for a parent account to enroll your children</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    className="h-10"
                    {...register("firstName")}
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Dela Cruz"
                    className="h-10"
                    {...register("lastName")}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  placeholder="Santos (Optional)"
                  className="h-10"
                  {...register("middleName")}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@email.com"
                    className="h-10"
                    {...register("email")}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    placeholder="09171234567"
                    className="h-10"
                    {...register("contactNumber")}
                    disabled={isLoading}
                  />
                  {errors.contactNumber && (
                    <p className="text-sm text-destructive">{errors.contactNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Rizal St., Olongapo City (Optional)"
                  className="h-10"
                  {...register("address")}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    className="h-10"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    className="h-10"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 bg-maroon hover:bg-maroon-dark text-white font-medium mt-1" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-maroon hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
