"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  Send,
  Upload,
  X,
  FileText,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const enrollmentSchema = z.object({
  gradeLevel: z.string().min(1, "Grade level is required"),
  studentNo: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  birthDate: z.string().min(1, "Date of birth is required"),
  birthPlace: z.string().min(1, "Place of birth is required"),
  gender: z.enum(["male", "female"], { required_error: "Gender is required" }),
  address: z.string().min(1, "Address is required"),
  contactNo: z.string().min(1, "Contact number is required"),
  numberOfSiblings: z.string().optional(),
  lastSchoolAttended: z.string().optional(),
  isCatholic: z.enum(["yes", "no"], { required_error: "Please specify religion" }),
  religion: z.string().optional(),
  parentGuardianName: z.string().min(1, "Parent/Guardian name is required"),
  parentOccupation: z.string().min(1, "Parent/Guardian occupation is required"),
  parentAddress: z.string().min(1, "Parent/Guardian address is required"),
  monthlyIncome: z.string().min(1, "Monthly income is required"),
}).refine((data) => {
  if (data.isCatholic === "no" && !data.religion) {
    return false;
  }
  return true;
}, {
  message: "Please specify religion",
  path: ["religion"],
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

const DOCUMENT_TYPES = [
  { id: "report_card", label: "Report Card (Latest)", required: true },
  { id: "birth_certificate", label: "Birth Certificate", required: true },
  { id: "form_137", label: "Form 137", required: true },
  { id: "good_moral", label: "Good Moral", required: true },
  { id: "baptismal", label: "Baptismal Certificate", required: false },
  { id: "indigency_certificate", label: "Indigency Certificate", required: false },
  { id: "picture_2x2", label: "2x2 Picture", required: true },
];

const MONTHLY_INCOME_OPTIONS = [
  "Below ₱10,000",
  "₱10,001 - ₱20,000",
  "₱20,001 - ₱40,000",
  "₱40,001 - ₱60,000",
  "₱60,001 - ₱80,000",
  "₱80,001 - ₱100,000",
  "Above ₱100,000",
];

const GRADE_LEVELS = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export default function NewEnrollmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      isCatholic: "yes",
    },
  });

  const isCatholic = watch("isCatholic");

  const handleFileUpload = (documentId: string, file: File | null) => {
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [documentId]: file }));
    } else {
      setUploadedFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[documentId];
        return newFiles;
      });
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);

    try {
      // Check if all required documents are uploaded
      const missingDocs = DOCUMENT_TYPES.filter(
        (doc) => doc.required && !uploadedFiles[doc.id]
      );

      if (missingDocs.length > 0) {
        toast({
          title: "Missing Required Documents",
          description: `Please upload: ${missingDocs.map((d) => d.label).join(", ")}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Form Data:", data);
      console.log("Uploaded Files:", uploadedFiles);

      toast({
        title: "Enrollment Submitted!",
        description: "Your enrollment application has been submitted successfully.",
      });

      router.push("/parent/enrollments");
    } catch (error) {
      console.error(error);
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 pb-16 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Enrollment</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill out the form below to enroll a student
          </p>
        </div>
        <Link href="/parent/enrollments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grade Level */}
            <div>
              <Label htmlFor="gradeLevel">
                Grade <span className="text-red-500">*</span>
              </Label>
              <select
                id="gradeLevel"
                {...register("gradeLevel")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#b4040d] focus:outline-none focus:ring-1 focus:ring-[#b4040d]"
              >
                <option value="">Select Grade Level</option>
                {GRADE_LEVELS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.gradeLevel && (
                <p className="mt-1 text-sm text-red-500">{errors.gradeLevel.message}</p>
              )}
            </div>

            {/* Student No */}
            <div>
              <Label htmlFor="studentNo">Student No</Label>
              <Input
                id="studentNo"
                {...register("studentNo")}
                placeholder="Leave blank if new student"
              />
            </div>

            {/* Name */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" {...register("middleName")} />
              </div>
            </div>

            {/* Birth Date and Place */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="birthDate">
                  Date of Birth (MM/DD/YYYY) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate")}
                />
                {errors.birthDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.birthDate.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="birthPlace">
                  Place of Birth <span className="text-red-500">*</span>
                </Label>
                <Input id="birthPlace" {...register("birthPlace")} />
                {errors.birthPlace && (
                  <p className="mt-1 text-sm text-red-500">{errors.birthPlace.message}</p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="gender">
                Gender <span className="text-red-500">*</span>
              </Label>
              <select
                id="gender"
                {...register("gender")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#b4040d] focus:outline-none focus:ring-1 focus:ring-[#b4040d]"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input id="address" {...register("address")} />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            {/* Contact No */}
            <div>
              <Label htmlFor="contactNo">
                Contact No <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactNo"
                {...register("contactNo")}
                placeholder="+63 XXX XXX XXXX"
              />
              {errors.contactNo && (
                <p className="mt-1 text-sm text-red-500">{errors.contactNo.message}</p>
              )}
            </div>

            {/* No. of Siblings */}
            <div>
              <Label htmlFor="numberOfSiblings">No. of Siblings</Label>
              <Input
                id="numberOfSiblings"
                type="number"
                min="0"
                {...register("numberOfSiblings")}
              />
            </div>

            {/* Last School Attended */}
            <div>
              <Label htmlFor="lastSchoolAttended">School you last Attended</Label>
              <Input id="lastSchoolAttended" {...register("lastSchoolAttended")} />
            </div>

            {/* Catholic */}
            <div>
              <Label htmlFor="isCatholic">
                Catholic? <span className="text-red-500">*</span>
              </Label>
              <select
                id="isCatholic"
                {...register("isCatholic")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#b4040d] focus:outline-none focus:ring-1 focus:ring-[#b4040d]"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              {errors.isCatholic && (
                <p className="mt-1 text-sm text-red-500">{errors.isCatholic.message}</p>
              )}
            </div>

            {/* Religion (if not Catholic) */}
            {isCatholic === "no" && (
              <div>
                <Label htmlFor="religion">
                  What Religion? <span className="text-red-500">*</span>
                </Label>
                <Input id="religion" {...register("religion")} />
                {errors.religion && (
                  <p className="mt-1 text-sm text-red-500">{errors.religion.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent/Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle>Parent/Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name of Parent/Guardian */}
            <div>
              <Label htmlFor="parentGuardianName">
                Name of Parent/Guardian <span className="text-red-500">*</span>
              </Label>
              <Input id="parentGuardianName" {...register("parentGuardianName")} />
              {errors.parentGuardianName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.parentGuardianName.message}
                </p>
              )}
            </div>

            {/* Occupation */}
            <div>
              <Label htmlFor="parentOccupation">
                Occupation of Parent/Guardian <span className="text-red-500">*</span>
              </Label>
              <Input id="parentOccupation" {...register("parentOccupation")} />
              {errors.parentOccupation && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.parentOccupation.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="parentAddress">
                Address of Parent/Guardian <span className="text-red-500">*</span>
              </Label>
              <Input id="parentAddress" {...register("parentAddress")} />
              {errors.parentAddress && (
                <p className="mt-1 text-sm text-red-500">{errors.parentAddress.message}</p>
              )}
            </div>

            {/* Monthly Income */}
            <div>
              <Label htmlFor="monthlyIncome">
                Monthly Income <span className="text-red-500">*</span>
              </Label>
              <select
                id="monthlyIncome"
                {...register("monthlyIncome")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#b4040d] focus:outline-none focus:ring-1 focus:ring-[#b4040d]"
              >
                <option value="">Select Monthly Income Range</option>
                {MONTHLY_INCOME_OPTIONS.map((income) => (
                  <option key={income} value={income}>
                    {income}
                  </option>
                ))}
              </select>
              {errors.monthlyIncome && (
                <p className="mt-1 text-sm text-red-500">{errors.monthlyIncome.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DOCUMENT_TYPES.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <Label className="text-base">
                      {doc.label}
                      {doc.required && <span className="ml-1 text-red-500">*</span>}
                    </Label>
                    {uploadedFiles[doc.id] && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <FileText className="h-4 w-4" />
                        <span>{uploadedFiles[doc.id].name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {uploadedFiles[doc.id] ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload(doc.id, null)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*,application/pdf";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleFileUpload(doc.id, file);
                          };
                          input.click();
                        }}
                      >
                        <Upload className="mr-1 h-4 w-4" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/parent/enrollments">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#b4040d] hover:bg-[#8a0309]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Enrollment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
