"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Send, Upload, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";

// ── Document types matching the API constants ─────────────────────────────────
const DOCUMENT_TYPES = [
  { id: "report_card",          label: "Report Card (Latest)",              required: true  },
  { id: "psa_birth_certificate",label: "Birth Certificate (PSA)",           required: true  },
  { id: "good_moral",           label: "Good Moral Certificate",            required: true  },
  { id: "id_photo",             label: "2x2 ID Picture",                    required: true  },
  { id: "transfer_certificate", label: "Form 137 / Transfer Credentials",   required: false },
  { id: "medical_certificate",  label: "Medical Certificate",               required: false },
  { id: "other",                label: "Indigency Certificate / Baptismal / Others", required: false },
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
  "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
  "Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12",
];

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  enrollmentType: z.enum(["new", "returning", "transferee"], { required_error: "Enrollment type is required" }),
  gradeLevel:     z.string().min(1, "Grade level is required"),
  studentNo:      z.string().optional(),
  lastName:       z.string().min(1, "Last name is required"),
  firstName:      z.string().min(1, "First name is required"),
  middleName:     z.string().optional(),
  birthDate:      z.string().min(1, "Date of birth is required"),
  birthPlace:     z.string().min(1, "Place of birth is required"),
  gender:         z.enum(["male", "female"], { required_error: "Gender is required" }),
  street:         z.string().min(1, "Address is required"),
  barangay:       z.string().min(1, "Barangay is required"),
  city:           z.string().min(1, "City is required"),
  province:       z.string().min(1, "Province is required"),
  zipCode:        z.string().min(1, "Zip code is required"),
  contactNo:      z.string().optional(),
  numberOfSiblings: z.string().optional(),
  lastSchoolAttended: z.string().optional(),
  isCatholic:     z.enum(["yes", "no"]),
  religion:       z.string().optional(),
  guardianName:   z.string().min(1, "Parent/Guardian name is required"),
  parentOccupation: z.string().optional(),
  parentAddress:  z.string().optional(),
  monthlyIncome:  z.string().min(1, "Monthly income is required"),
}).refine((d) => !(d.isCatholic === "no" && !d.religion), {
  message: "Please specify religion",
  path: ["religion"],
});

type FormData = z.infer<typeof schema>;

type UploadedDoc = {
  documentType: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
};

export default function NewEnrollmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isCatholic: "yes", enrollmentType: "new" },
  });

  const isCatholic = watch("isCatholic");

  // Upload a single file to /api/upload and return the doc object
  const uploadFile = async (docId: string, file: File): Promise<UploadedDoc | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("documentType", docId);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }
    return res.json();
  };

  const handleFileSelect = async (docId: string, file: File | null) => {
    if (!file) {
      setUploadedFiles((p) => { const n = { ...p }; delete n[docId]; return n; });
      setUploadedDocs((p)  => { const n = { ...p }; delete n[docId]; return n; });
      return;
    }

    setUploadedFiles((p) => ({ ...p, [docId]: file }));
    setUploadingId(docId);
    try {
      const result = await uploadFile(docId, file);
      if (result) {
        setUploadedDocs((p) => ({
          ...p,
          [docId]: {
            documentType: result.documentType || docId,
            url: result.url,
            filename: result.filename,
            originalName: result.originalName || file.name,
            size: result.size || file.size,
            mimeType: result.mimeType || file.type,
          },
        }));
        toast({ title: "File uploaded", description: `${file.name} ready` });
      }
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
      setUploadedFiles((p) => { const n = { ...p }; delete n[docId]; return n; });
    } finally {
      setUploadingId(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Check required documents
      const missingDocs = DOCUMENT_TYPES.filter(
        (d) => d.required && !uploadedDocs[d.id]
      );
      if (missingDocs.length > 0) {
        toast({
          title: "Missing Required Documents",
          description: `Please upload: ${missingDocs.map((d) => d.label).join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      const payload = {
        enrollmentType: data.enrollmentType,
        gradeLevel:     data.gradeLevel,
        lrn:            data.studentNo || undefined,
        firstName:      data.firstName,
        lastName:       data.lastName,
        middleName:     data.middleName || undefined,
        birthDate:      data.birthDate,
        birthPlace:     data.birthPlace,
        gender:         data.gender,
        religion:       data.isCatholic === "no" ? data.religion : "Catholic",
        street:         data.street,
        barangay:       data.barangay,
        city:           data.city,
        province:       data.province,
        zipCode:        data.zipCode,
        guardianName:   data.guardianName,
        guardianContact: data.contactNo || "",
        guardianRelationship: "Parent/Guardian",
        previousSchoolName: data.lastSchoolAttended || undefined,
        // Extra info stored in draftData-like fields (not blocked by API)
        monthlyIncome:  data.monthlyIncome,
        numberOfSiblings: data.numberOfSiblings,
        parentOccupation: data.parentOccupation,
        parentAddress:  data.parentAddress,
        uploadedDocuments: Object.values(uploadedDocs),
      };

      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: "Submission Failed",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Enrollment Submitted!",
        description: `Enrollment #${result.enrollment?.enrollmentNumber} submitted successfully.`,
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

  const labelCls = "block text-xs font-medium text-gray-700";
  const errorCls = "mt-0.5 text-xs text-red-500";

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Enrollment</h1>
          <p className="text-xs text-gray-500 mt-0.5">Fill out the form to enroll a student</p>
        </div>
        <Link href="/parent/enrollments">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ── Student Information ───────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* Enrollment Type */}
            <div>
              <label className={labelCls}>Enrollment Type <span className="text-red-500">*</span></label>
              <Controller
                name="enrollmentType"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "new", label: "New Student" },
                      { value: "returning", label: "Returning Student" },
                      { value: "transferee", label: "Transferee" },
                    ]}
                    className="mt-1"
                  />
                )}
              />
              {errors.enrollmentType && <p className={errorCls}>{errors.enrollmentType.message}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Grade */}
              <div>
                <label className={labelCls}>Grade <span className="text-red-500">*</span></label>
                <Controller
                  name="gradeLevel"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select Grade Level"
                      options={GRADE_LEVELS.map((g) => ({ value: g, label: g }))}
                      className="mt-1"
                    />
                  )}
                />
                {errors.gradeLevel && <p className={errorCls}>{errors.gradeLevel.message}</p>}
              </div>
              {/* Student No / LRN */}
              <div>
                <label className={labelCls}>Student No / LRN</label>
                <Input {...register("studentNo")} placeholder="Leave blank if new" className="mt-1 h-8 text-sm" />
              </div>
            </div>

            {/* Name */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                <Input {...register("lastName")} className="mt-1 h-8 text-sm" />
                {errors.lastName && <p className={errorCls}>{errors.lastName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <Input {...register("firstName")} className="mt-1 h-8 text-sm" />
                {errors.firstName && <p className={errorCls}>{errors.firstName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Middle Name</label>
                <Input {...register("middleName")} className="mt-1 h-8 text-sm" />
              </div>
            </div>

            {/* DOB & POB */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      maxYear={new Date().getFullYear() - 3}
                      minYear={1950}
                      className="mt-1"
                    />
                  )}
                />
                {errors.birthDate && <p className={errorCls}>{errors.birthDate.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Place of Birth <span className="text-red-500">*</span></label>
                <Input {...register("birthPlace")} className="mt-1 h-8 text-sm" />
                {errors.birthPlace && <p className={errorCls}>{errors.birthPlace.message}</p>}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Gender"
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ]}
                    className="mt-1"
                  />
                )}
              />
              {errors.gender && <p className={errorCls}>{errors.gender.message}</p>}
            </div>

            {/* Address */}
            <div>
              <label className={labelCls}>Street / House No. / Purok <span className="text-red-500">*</span></label>
              <Input {...register("street")} className="mt-1 h-8 text-sm" />
              {errors.street && <p className={errorCls}>{errors.street.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Barangay <span className="text-red-500">*</span></label>
                <Input {...register("barangay")} className="mt-1 h-8 text-sm" />
                {errors.barangay && <p className={errorCls}>{errors.barangay.message}</p>}
              </div>
              <div>
                <label className={labelCls}>City / Municipality <span className="text-red-500">*</span></label>
                <Input {...register("city")} className="mt-1 h-8 text-sm" />
                {errors.city && <p className={errorCls}>{errors.city.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Province <span className="text-red-500">*</span></label>
                <Input {...register("province")} className="mt-1 h-8 text-sm" />
                {errors.province && <p className={errorCls}>{errors.province.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Zip Code <span className="text-red-500">*</span></label>
                <Input {...register("zipCode")} className="mt-1 h-8 text-sm" />
                {errors.zipCode && <p className={errorCls}>{errors.zipCode.message}</p>}
              </div>
            </div>

            {/* Contact & Siblings */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Contact No</label>
                <Input {...register("contactNo")} placeholder="+63 XXX XXX XXXX" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <label className={labelCls}>No. of Siblings</label>
                <Input type="number" min="0" {...register("numberOfSiblings")} className="mt-1 h-8 text-sm" />
              </div>
            </div>

            {/* Last School */}
            <div>
              <label className={labelCls}>School Last Attended</label>
              <Input {...register("lastSchoolAttended")} className="mt-1 h-8 text-sm" />
            </div>

            {/* Catholic */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Catholic? <span className="text-red-500">*</span></label>
                <Controller
                  name="isCatholic"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                      className="mt-1"
                    />
                  )}
                />
              </div>
              {isCatholic === "no" && (
                <div>
                  <label className={labelCls}>Religion <span className="text-red-500">*</span></label>
                  <Input {...register("religion")} className="mt-1 h-8 text-sm" />
                  {errors.religion && <p className={errorCls}>{errors.religion.message}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Parent / Guardian Information ───────────────────── */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Parent / Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div>
              <label className={labelCls}>Name of Parent / Guardian <span className="text-red-500">*</span></label>
              <Input {...register("guardianName")} className="mt-1 h-8 text-sm" />
              {errors.guardianName && <p className={errorCls}>{errors.guardianName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Occupation of Parent / Guardian</label>
              <Input {...register("parentOccupation")} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <label className={labelCls}>Address of Parent / Guardian</label>
              <Input {...register("parentAddress")} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <label className={labelCls}>Monthly Income <span className="text-red-500">*</span></label>
              <Controller
                name="monthlyIncome"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Monthly Income Range"
                    options={MONTHLY_INCOME_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                    className="mt-1"
                  />
                )}
              />
              {errors.monthlyIncome && <p className={errorCls}>{errors.monthlyIncome.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* ── Documents ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Required Documents</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {DOCUMENT_TYPES.map((doc) => {
                const uploaded = !!uploadedDocs[doc.id];
                const isUploading = uploadingId === doc.id;
                return (
                  <div key={doc.id} className={`flex items-center justify-between rounded-lg border p-3 ${uploaded ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {doc.label}
                        {doc.required && <span className="ml-1 text-red-500 text-xs">*</span>}
                      </p>
                      {uploaded && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{uploadedFiles[doc.id]?.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {uploaded ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setUploadedFiles((p) => { const n = { ...p }; delete n[doc.id]; return n; });
                            setUploadedDocs((p)  => { const n = { ...p }; delete n[doc.id]; return n; });
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={isUploading}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*,application/pdf";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleFileSelect(doc.id, file);
                            };
                            input.click();
                          }}
                        >
                          {isUploading
                            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading...</>
                            : <><Upload className="h-3 w-3 mr-1" />Upload</>
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Submit ───────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Link href="/parent/enrollments">
            <Button type="button" variant="outline" size="sm" disabled={isSubmitting} className="h-8 text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || uploadingId !== null}
            className="h-8 text-xs bg-[#b4040d] hover:bg-[#8a0309]"
          >
            {isSubmitting
              ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Submitting...</>
              : <><Send className="mr-1.5 h-3.5 w-3.5" />Submit Enrollment</>
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
