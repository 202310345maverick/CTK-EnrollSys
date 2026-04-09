"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const steps = [
  { id: 1, title: "Student Information", description: "Basic student details" },
  { id: 2, title: "Grade Level", description: "Select grade level" },
  { id: 3, title: "Guardian Information", description: "Parent/Guardian details" },
  { id: 4, title: "Address", description: "Contact address" },
  { id: 5, title: "Documents", description: "Upload required documents" },
];

// Separate schemas for each step
const step1Schema = z.object({
  enrollmentType: z.enum(["new", "returning", "transferee"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  birthDate: z.string().min(1, "Birth date is required"),
  birthPlace: z.string().min(1, "Birth place is required"),
  gender: z.enum(["male", "female"]),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  lrn: z.string().optional(),
});

const step2Schema = z.object({
  gradeLevel: z.string().min(1, "Grade level is required"),
});

const step3Schema = z.object({
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherContact: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherContact: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  guardianContact: z.string().optional(),
});

const step4Schema = z.object({
  street: z.string().min(1, "Street address is required"),
  barangay: z.string().min(1, "Barangay is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
});

const enrollmentSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

export default function EnrollmentWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      enrollmentType: "new",
      nationality: "Filipino",
      gender: "male",
    },
    mode: "onTouched",
  });

  const gradeLevels = [
    "Kinder 1",
    "Kinder 2",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
  ];

  // Fields to validate per step
  const stepFields: Record<number, (keyof EnrollmentFormData)[]> = {
    1: ["enrollmentType", "firstName", "lastName", "birthDate", "birthPlace", "gender"],
    2: ["gradeLevel"],
    3: [], // All optional
    4: ["street", "barangay", "city", "province", "zipCode"],
    5: [], // Documents handled separately
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep];
    
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);
    try {
      const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";

      if (isDemo) {
        // Simulate server response and save to localStorage for demo purposes
        const enrollment = {
          id: `demo-${Date.now()}`,
          enrollmentNumber: `ENR-DEMO-${Date.now()}`,
          status: "pending",
          createdAt: new Date().toISOString(),
          student: {
            firstName: data.firstName,
            lastName: data.lastName,
            gradeLevel: data.gradeLevel,
          },
        };

        const existing = JSON.parse(localStorage.getItem("demo_enrollments") || "[]");
        existing.unshift(enrollment);
        localStorage.setItem("demo_enrollments", JSON.stringify(existing));

        toast({
          title: "Enrollment Submitted!",
          description: "Your enrollment application has been submitted (demo).",
        });

        router.push("/parent");
        return;
      }

      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit enrollment");
      }

      toast({
        title: "Enrollment Submitted!",
        description: "Your enrollment application has been submitted successfully.",
      });

      router.push("/parent");
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit enrollment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enrollment Type *</Label>
              <div className="flex gap-4">
                {["new", "returning", "transferee"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={type}
                      {...register("enrollmentType")}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{type} Student</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" {...register("middleName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix (Jr., Sr., III)</Label>
                <Input id="suffix" {...register("suffix")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date of Birth *</Label>
                <Input id="birthDate" type="date" {...register("birthDate")} />
                {errors.birthDate && (
                  <p className="text-sm text-destructive">{errors.birthDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Place of Birth *</Label>
                <Input id="birthPlace" {...register("birthPlace")} />
                {errors.birthPlace && (
                  <p className="text-sm text-destructive">{errors.birthPlace.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="male" {...register("gender")} className="w-4 h-4" />
                    <span>Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="female" {...register("gender")} className="w-4 h-4" />
                    <span>Female</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" {...register("nationality")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input id="religion" {...register("religion")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lrn">LRN (if available)</Label>
                <Input id="lrn" {...register("lrn")} placeholder="12 digits" />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label>Select Grade Level *</Label>
            <div className="grid grid-cols-3 gap-3">
              {gradeLevels.map((grade) => (
                <label
                  key={grade}
                  className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${
                    watch("gradeLevel") === grade ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <input
                    type="radio"
                    value={grade}
                    {...register("gradeLevel")}
                    className="sr-only"
                  />
                  <span className="font-medium">{grade}</span>
                </label>
              ))}
            </div>
            {errors.gradeLevel && (
              <p className="text-sm text-destructive">{errors.gradeLevel.message}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Father&apos;s Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Full Name</Label>
                  <Input id="fatherName" {...register("fatherName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherOccupation">Occupation</Label>
                  <Input id="fatherOccupation" {...register("fatherOccupation")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherContact">Contact Number</Label>
                  <Input id="fatherContact" {...register("fatherContact")} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Mother&apos;s Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motherName">Full Name</Label>
                  <Input id="motherName" {...register("motherName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherOccupation">Occupation</Label>
                  <Input id="motherOccupation" {...register("motherOccupation")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherContact">Contact Number</Label>
                  <Input id="motherContact" {...register("motherContact")} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Guardian (if different)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Full Name</Label>
                  <Input id="guardianName" {...register("guardianName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianRelationship">Relationship</Label>
                  <Input id="guardianRelationship" {...register("guardianRelationship")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianContact">Contact Number</Label>
                  <Input id="guardianContact" {...register("guardianContact")} />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input id="street" {...register("street")} placeholder="123 Rizal Street" />
              {errors.street && (
                <p className="text-sm text-destructive">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barangay">Barangay *</Label>
                <Input id="barangay" {...register("barangay")} />
                {errors.barangay && (
                  <p className="text-sm text-destructive">{errors.barangay.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City/Municipality *</Label>
                <Input id="city" {...register("city")} />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province *</Label>
                <Input id="province" {...register("province")} />
                {errors.province && (
                  <p className="text-sm text-destructive">{errors.province.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input id="zipCode" {...register("zipCode")} />
                {errors.zipCode && (
                  <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Please upload the following required documents:
            </p>
            <div className="space-y-4">
              {[
                { id: "psa", label: "PSA Birth Certificate", required: true },
                { id: "reportCard", label: "Report Card (Form 138)", required: true },
                { id: "idPhoto", label: "2x2 ID Photo", required: true },
                { id: "goodMoral", label: "Certificate of Good Moral Character", required: false },
              ].map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {doc.label}
                      {doc.required && <span className="text-destructive ml-1">*</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">PDF, JPG, PNG (max 5MB)</p>
                  </div>
                  <Input type="file" className="w-auto" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <p className="mt-2 text-xs font-medium text-center">{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-0.5 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext}>
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Enrollment
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
