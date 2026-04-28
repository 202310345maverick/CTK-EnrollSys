"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Send,
  Upload,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  ENROLLMENT_DOCUMENT_LABELS,
  ENROLLMENT_DOCUMENT_TYPES,
  EnrollmentDocumentType,
  getRequiredDocumentTypes,
} from "@/lib/enrollment/constants";

const enrollmentSchema = z
  .object({
    enrollmentType: z.enum(["new", "returning", "transferee"]),
    existingStudentId: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
    suffix: z.string().optional(),
    birthDate: z.string().min(1, "Birth date is required"),
    birthPlace: z.string().min(1, "Birth place is required"),
    gender: z.enum(["male", "female"]),
    nationality: z.string().min(1, "Nationality is required"),
    religion: z.string().optional(),
    lrn: z.string().optional(),
    gradeLevel: z.string().min(1, "Grade level is required"),
    fatherName: z.string().optional(),
    fatherOccupation: z.string().optional(),
    fatherContact: z.string().optional(),
    motherName: z.string().optional(),
    motherOccupation: z.string().optional(),
    motherContact: z.string().optional(),
    guardianName: z.string().optional(),
    guardianRelationship: z.string().optional(),
    guardianContact: z.string().optional(),
    street: z.string().min(1, "Street address is required"),
    barangay: z.string().min(1, "Barangay is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    previousSchoolName: z.string().optional(),
    previousSchoolAddress: z.string().optional(),
    previousSchoolLastGradeCompleted: z.string().optional(),
    previousSchoolYear: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.enrollmentType === "returning" && !data.existingStudentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["existingStudentId"],
        message: "Please select an existing child for returning enrollment.",
      });
    }

    if (data.enrollmentType === "transferee") {
      if (!data.previousSchoolName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["previousSchoolName"],
          message: "Previous school name is required for transferees.",
        });
      }
      if (!data.previousSchoolLastGradeCompleted) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["previousSchoolLastGradeCompleted"],
          message: "Last grade completed is required for transferees.",
        });
      }
      if (!data.previousSchoolYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["previousSchoolYear"],
          message: "Previous school year is required for transferees.",
        });
      }
    }
  });

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

type ChildRecord = {
  _id: string;
  lrn?: string;
  currentGradeLevel?: string;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    suffix?: string;
    birthDate?: string;
    birthPlace?: string;
    gender?: "male" | "female";
    nationality?: string;
    religion?: string;
  };
  contactInfo?: {
    address?: {
      street?: string;
      barangay?: string;
      city?: string;
      province?: string;
      zipCode?: string;
    };
  };
  guardianInfo?: {
    father?: {
      fullName?: string;
      occupation?: string;
      contactNumber?: string;
    };
    mother?: {
      fullName?: string;
      occupation?: string;
      contactNumber?: string;
    };
    guardian?: {
      fullName?: string;
      relationship?: string;
      contactNumber?: string;
    };
  };
};

type UploadedDocument = {
  documentType: EnrollmentDocumentType;
  url: string;
  filename: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
};

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

const stepTitles = [
  "Student Information",
  "Address and Guardian",
  "Documents and Review",
] as const;

const defaultValues: EnrollmentFormData = {
  enrollmentType: "new",
  existingStudentId: "",
  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  birthDate: "",
  birthPlace: "",
  gender: "male",
  nationality: "Filipino",
  religion: "",
  lrn: "",
  gradeLevel: "",
  fatherName: "",
  fatherOccupation: "",
  fatherContact: "",
  motherName: "",
  motherOccupation: "",
  motherContact: "",
  guardianName: "",
  guardianRelationship: "",
  guardianContact: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  zipCode: "",
  previousSchoolName: "",
  previousSchoolAddress: "",
  previousSchoolLastGradeCompleted: "",
  previousSchoolYear: "",
};

export default function EnrollmentFormPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Partial<Record<EnrollmentDocumentType, UploadedDocument>>
  >({});
  const [uploadingDocumentType, setUploadingDocumentType] =
    useState<EnrollmentDocumentType | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues,
    mode: "onTouched",
  });

  const enrollmentType = watch("enrollmentType");
  const existingStudentId = watch("existingStudentId");
  const requiredDocumentTypes = useMemo(
    () => getRequiredDocumentTypes(enrollmentType),
    [enrollmentType]
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        const studentsResponse = await fetch("/api/students?limit=100");
        if (studentsResponse.ok) {
          const studentsResult = await studentsResponse.json();
          setChildren(studentsResult.students || []);
        }

        const draftParam = new URLSearchParams(window.location.search).get("draft");
        if (!draftParam) {
          return;
        }

        const draftResponse = await fetch(`/api/enrollments/${draftParam}`);
        if (!draftResponse.ok) {
          return;
        }

        const draftResult = await draftResponse.json();
        const draft = draftResult?.enrollment;
        if (!draft?.isDraft || !draft?.draftData) {
          return;
        }

        const snapshot = draft.draftData as Partial<EnrollmentFormData> & {
          uploadedDocuments?: UploadedDocument[];
        };

        for (const [key, value] of Object.entries(snapshot)) {
          if (key === "uploadedDocuments") {
            continue;
          }
          if (value !== undefined) {
            setValue(key as keyof EnrollmentFormData, value as never, {
              shouldDirty: false,
            });
          }
        }

        if (Array.isArray(snapshot.uploadedDocuments)) {
          const mapped: Partial<Record<EnrollmentDocumentType, UploadedDocument>> =
            {};
          for (const document of snapshot.uploadedDocuments) {
            mapped[document.documentType] = document;
          }
          setUploadedDocuments(mapped);
        }

        setDraftId(draft._id);
      } catch (error) {
        console.error("Failed to initialize enrollment form:", error);
      } finally {
        setIsLoadingDraft(false);
      }
    };

    void initialize();
  }, [setValue]);

  useEffect(() => {
    if (enrollmentType !== "returning" || !existingStudentId) {
      return;
    }

    const selectedChild = children.find((child) => child._id === existingStudentId);
    if (!selectedChild) {
      return;
    }

    setValue("firstName", selectedChild.personalInfo?.firstName || "");
    setValue("lastName", selectedChild.personalInfo?.lastName || "");
    setValue("middleName", selectedChild.personalInfo?.middleName || "");
    setValue("suffix", selectedChild.personalInfo?.suffix || "");
    setValue(
      "birthDate",
      selectedChild.personalInfo?.birthDate
        ? new Date(selectedChild.personalInfo.birthDate).toISOString().slice(0, 10)
        : ""
    );
    setValue("birthPlace", selectedChild.personalInfo?.birthPlace || "");
    setValue("gender", selectedChild.personalInfo?.gender || "male");
    setValue("nationality", selectedChild.personalInfo?.nationality || "Filipino");
    setValue("religion", selectedChild.personalInfo?.religion || "");
    setValue("lrn", selectedChild.lrn || "");
    setValue("gradeLevel", selectedChild.currentGradeLevel || "");
    setValue(
      "street",
      selectedChild.contactInfo?.address?.street || ""
    );
    setValue(
      "barangay",
      selectedChild.contactInfo?.address?.barangay || ""
    );
    setValue("city", selectedChild.contactInfo?.address?.city || "");
    setValue(
      "province",
      selectedChild.contactInfo?.address?.province || ""
    );
    setValue(
      "zipCode",
      selectedChild.contactInfo?.address?.zipCode || ""
    );
    setValue("fatherName", selectedChild.guardianInfo?.father?.fullName || "");
    setValue(
      "fatherOccupation",
      selectedChild.guardianInfo?.father?.occupation || ""
    );
    setValue(
      "fatherContact",
      selectedChild.guardianInfo?.father?.contactNumber || ""
    );
    setValue("motherName", selectedChild.guardianInfo?.mother?.fullName || "");
    setValue(
      "motherOccupation",
      selectedChild.guardianInfo?.mother?.occupation || ""
    );
    setValue(
      "motherContact",
      selectedChild.guardianInfo?.mother?.contactNumber || ""
    );
    setValue(
      "guardianName",
      selectedChild.guardianInfo?.guardian?.fullName || ""
    );
    setValue(
      "guardianRelationship",
      selectedChild.guardianInfo?.guardian?.relationship || ""
    );
    setValue(
      "guardianContact",
      selectedChild.guardianInfo?.guardian?.contactNumber || ""
    );
  }, [children, enrollmentType, existingStudentId, setValue]);

  const stepFields: Array<Array<keyof EnrollmentFormData>> = [
    [
      "enrollmentType",
      "existingStudentId",
      "firstName",
      "lastName",
      "birthDate",
      "birthPlace",
      "gender",
      "nationality",
      "gradeLevel",
      "previousSchoolName",
      "previousSchoolLastGradeCompleted",
      "previousSchoolYear",
    ],
    ["street", "barangay", "city", "province", "zipCode"],
    [],
  ];

  const goToNextStep = async () => {
    const fields = stepFields[currentStep];
    const isValid = fields.length > 0 ? await trigger(fields) : true;
    if (!isValid) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, stepTitles.length - 1));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const buildUploadedDocumentList = (): UploadedDocument[] => {
    return Object.values(uploadedDocuments).filter(
      (document): document is UploadedDocument => Boolean(document)
    );
  };

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const payload = getValues();
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save_draft",
          draftId,
          formData: payload,
          uploadedDocuments: buildUploadedDocumentList(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save draft");
      }

      const nextDraftId = result?.draft?.id;
      if (nextDraftId) {
        setDraftId(nextDraftId);
        router.replace(`/parent/enrollment/new?draft=${nextDraftId}`);
      }

      toast({
        variant: "success",
        title: "Draft saved",
        description: "You can continue this enrollment any time.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Draft save failed",
        description: error instanceof Error ? error.message : "Failed to save draft.",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "submit",
          draftId,
          formData: data,
          uploadedDocuments: buildUploadedDocumentList(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit enrollment.");
      }

      toast({
        variant: "success",
        title: "Enrollment submitted",
        description: "Your enrollment application was submitted successfully.",
      });
      router.push("/parent/enrollments");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit enrollment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: EnrollmentDocumentType
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingDocumentType(documentType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload document.");
      }

      setUploadedDocuments((prev) => ({
        ...prev,
        [documentType]: {
          documentType,
          url: result.url,
          filename: result.filename,
          originalName: result.originalName,
          size: result.size,
          mimeType: result.mimeType,
        },
      }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file.",
      });
    } finally {
      setUploadingDocumentType(null);
      event.target.value = "";
    }
  };

  const uploadedRequiredCount = requiredDocumentTypes.filter(
    (type) => uploadedDocuments[type]
  ).length;

  if (isLoadingDraft) {
    return (
      <div className="flex min-h-[380px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="ctk-page-title">Online Enrollment</h1>
        <p className="ctk-page-subtitle">
          Complete the multi-step enrollment form and submit required documents.
        </p>
      </div>

      <Card className="ctk-panel">
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            {stepTitles.map((step, index) => (
              <div
                key={step}
                className={`rounded-lg border p-3 ${
                  currentStep === index
                    ? "border-primary bg-primary/5"
                    : index < currentStep
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-border bg-background"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </p>
                <p className="text-sm font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {currentStep === 0 && (
          <Card className="ctk-panel">
            <CardHeader>
              <CardTitle className="ctk-section-title">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Enrollment Type *</Label>
                <div className="flex flex-wrap gap-6">
                  {["new", "returning", "transferee"].map((type) => (
                    <label key={type} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        value={type}
                        {...register("enrollmentType")}
                        className="h-4 w-4"
                      />
                      <span className="capitalize">{type} Student</span>
                    </label>
                  ))}
                </div>
              </div>

              {enrollmentType === "returning" && (
                <div className="space-y-2">
                  <Label htmlFor="existingStudentId">Select Existing Child *</Label>
                  <select
                    id="existingStudentId"
                    className="ctk-input w-full border px-3 text-sm"
                    {...register("existingStudentId")}
                  >
                    <option value="">Select child</option>
                    {children.map((child) => (
                      <option key={child._id} value={child._id}>
                        {child.personalInfo?.firstName} {child.personalInfo?.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.existingStudentId && (
                    <p className="text-sm text-destructive">
                      {errors.existingStudentId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" className="ctk-input" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" className="ctk-input" {...register("middleName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" className="ctk-input" {...register("lastName")} />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date *</Label>
                  <Input id="birthDate" type="date" className="ctk-input" {...register("birthDate")} />
                  {errors.birthDate && (
                    <p className="text-sm text-destructive">{errors.birthDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Birth Place *</Label>
                  <Input id="birthPlace" className="ctk-input" {...register("birthPlace")} />
                  {errors.birthPlace && (
                    <p className="text-sm text-destructive">{errors.birthPlace.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    className="ctk-input w-full border px-3 text-sm"
                    {...register("gender")}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input id="nationality" className="ctk-input" {...register("nationality")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input id="religion" className="ctk-input" {...register("religion")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lrn">LRN</Label>
                  <Input id="lrn" className="ctk-input" placeholder="12 digits" {...register("lrn")} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level *</Label>
                  <select
                    id="gradeLevel"
                    className="ctk-input w-full border px-3 text-sm"
                    {...register("gradeLevel")}
                  >
                    <option value="">Select grade level</option>
                    {gradeLevels.map((gradeLevel) => (
                      <option key={gradeLevel} value={gradeLevel}>
                        {gradeLevel}
                      </option>
                    ))}
                  </select>
                  {errors.gradeLevel && (
                    <p className="text-sm text-destructive">{errors.gradeLevel.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input id="suffix" className="ctk-input" {...register("suffix")} />
                </div>
              </div>

              {enrollmentType === "transferee" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-900">
                    Previous School Information
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="previousSchoolName">School Name *</Label>
                      <Input
                        id="previousSchoolName"
                        className="ctk-input"
                        {...register("previousSchoolName")}
                      />
                      {errors.previousSchoolName && (
                        <p className="text-sm text-destructive">
                          {errors.previousSchoolName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousSchoolLastGradeCompleted">
                        Last Grade Completed *
                      </Label>
                      <Input
                        id="previousSchoolLastGradeCompleted"
                        className="ctk-input"
                        {...register("previousSchoolLastGradeCompleted")}
                      />
                      {errors.previousSchoolLastGradeCompleted && (
                        <p className="text-sm text-destructive">
                          {errors.previousSchoolLastGradeCompleted.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="previousSchoolAddress">School Address</Label>
                      <Input
                        id="previousSchoolAddress"
                        className="ctk-input"
                        {...register("previousSchoolAddress")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousSchoolYear">School Year *</Label>
                      <Input
                        id="previousSchoolYear"
                        className="ctk-input"
                        placeholder="e.g. 2024-2025"
                        {...register("previousSchoolYear")}
                      />
                      {errors.previousSchoolYear && (
                        <p className="text-sm text-destructive">
                          {errors.previousSchoolYear.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card className="ctk-panel">
            <CardHeader>
              <CardTitle className="ctk-section-title">Address and Guardian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Address</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street *</Label>
                    <Input id="street" className="ctk-input" {...register("street")} />
                    {errors.street && (
                      <p className="text-sm text-destructive">{errors.street.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay *</Label>
                    <Input id="barangay" className="ctk-input" {...register("barangay")} />
                    {errors.barangay && (
                      <p className="text-sm text-destructive">{errors.barangay.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" className="ctk-input" {...register("city")} />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Input id="province" className="ctk-input" {...register("province")} />
                    {errors.province && (
                      <p className="text-sm text-destructive">{errors.province.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input id="zipCode" className="ctk-input" {...register("zipCode")} />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Parents / Guardian</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father&apos;s Name</Label>
                    <Input id="fatherName" className="ctk-input" {...register("fatherName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherOccupation">Father&apos;s Occupation</Label>
                    <Input
                      id="fatherOccupation"
                      className="ctk-input"
                      {...register("fatherOccupation")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherContact">Father&apos;s Contact</Label>
                    <Input
                      id="fatherContact"
                      className="ctk-input"
                      {...register("fatherContact")}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother&apos;s Name</Label>
                    <Input id="motherName" className="ctk-input" {...register("motherName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherOccupation">Mother&apos;s Occupation</Label>
                    <Input
                      id="motherOccupation"
                      className="ctk-input"
                      {...register("motherOccupation")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherContact">Mother&apos;s Contact</Label>
                    <Input
                      id="motherContact"
                      className="ctk-input"
                      {...register("motherContact")}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input id="guardianName" className="ctk-input" {...register("guardianName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianRelationship">Guardian Relationship</Label>
                    <Input
                      id="guardianRelationship"
                      className="ctk-input"
                      {...register("guardianRelationship")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
                    <Input
                      id="guardianContact"
                      className="ctk-input"
                      {...register("guardianContact")}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="ctk-panel">
            <CardHeader>
              <CardTitle className="ctk-section-title">
                Document Checklist and Submission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p>
                  Required documents uploaded:{" "}
                  <span className="font-semibold">
                    {uploadedRequiredCount}/{requiredDocumentTypes.length}
                  </span>
                </p>
              </div>

              {ENROLLMENT_DOCUMENT_TYPES.map((documentType) => {
                const isRequired = requiredDocumentTypes.includes(documentType);
                const uploaded = uploadedDocuments[documentType];
                const isUploading = uploadingDocumentType === documentType;
                const inputId = `upload-${documentType}`;

                return (
                  <div
                    key={documentType}
                    className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-2 ${uploaded ? "bg-emerald-100" : "bg-amber-100"}`}>
                        {uploaded ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CircleAlert className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {ENROLLMENT_DOCUMENT_LABELS[documentType]}{" "}
                          {isRequired ? <span className="text-destructive">*</span> : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {uploaded ? uploaded.originalName || uploaded.filename : "Not uploaded"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <input
                        id={inputId}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(event) => handleDocumentUpload(event, documentType)}
                      />
                      <Button
                        type="button"
                        className="ctk-danger-button"
                        onClick={() => {
                          const input = document.getElementById(inputId) as HTMLInputElement | null;
                          input?.click();
                        }}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploaded ? "Replace" : "Upload"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG. Maximum file size is 5MB each.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="sticky bottom-4 flex flex-wrap justify-between gap-3 rounded-xl border bg-background/95 p-3 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg px-5"
            onClick={saveDraft}
            disabled={isSavingDraft || isSubmitting}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </>
            )}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg px-5"
              onClick={goToPreviousStep}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < stepTitles.length - 1 ? (
              <Button
                type="button"
                className="h-11 rounded-lg px-5 ctk-danger-button"
                onClick={goToNextStep}
                disabled={isSubmitting}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="h-11 rounded-lg px-5 ctk-danger-button"
                disabled={isSubmitting}
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
