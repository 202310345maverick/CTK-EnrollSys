"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Send, Upload, X, CheckCircle, RefreshCw, Trash2, Download, UserCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ACCEPT_FILE_INPUT } from "@/lib/enrollment/constants";
import { BARANGAYS, CITIES, MUNICIPALITIES } from "@/lib/locations";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { FormSelect } from "@/components/ui/form-select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";

// ── Document types matching the API constants ─────────────────────────────────
const DOCUMENT_TYPES = [
  { id: "report_card",          label: "Report Card (Latest)",              required: true  },
  { id: "psa_birth_certificate",label: "Birth Certificate (PSA)",           required: true  },
  { id: "good_moral",           label: "Good Moral Certificate",            required: true  },
  { id: "id_photo",             label: "2x2 ID Picture",                    required: true  },
  { id: "transfer_certificate", label: "Form 137 / Transfer Credentials",   required: false },
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
  "Kindergarten",
  "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
  "Grade 7","Grade 8","Grade 9","Grade 10",
];

// Document types not required for Kindergarten
const KINDER_EXEMPT_DOCS = new Set(["report_card", "good_moral", "transfer_certificate"]);

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  enrollmentType: z.enum(["new", "returning", "transferee"], { required_error: "Enrollment type is required" }),
  gradeLevel:     z.string().min(1, "Grade level is required"),
  studentNo:      z.string().optional().refine(
    (val) => !val || /^\d{12}$/.test(val),
    { message: "LRN must be exactly 12 digits" }
  ),
  lastName:       z.string().min(1, "Last name is required"),
  firstName:      z.string().min(1, "First name is required"),
  middleName:     z.string().optional(),
  birthDate:      z.string().min(1, "Date of birth is required"),
  birthPlace:     z.string().min(1, "Place of birth is required"),
  gender:         z.enum(["male", "female"], { required_error: "Gender is required" }),
  street:         z.string().min(1, "Address is required"),
  barangay:       z.string().min(1, "Barangay is required"),
  city:           z.string().min(1, "City is required"),
  municipality:   z.string().min(1, "Municipality is required"),
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
  bookOption:     z.enum(["purchase_new", "purchase_secondhand", "rental"], { required_error: "Please select a book option" }),
  bookRentalAgreed: z.boolean().optional(),
  peUniform:      z.enum(["add", "skip"], { required_error: "Please choose a PE uniform option" }),
}).refine((d) => !(d.isCatholic === "no" && !d.religion), {
  message: "Please specify religion",
  path: ["religion"],
}).refine((d) => !(d.bookOption === "rental" && !d.bookRentalAgreed), {
  message: "You must agree to the rental terms",
  path: ["bookRentalAgreed"],
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


type ChildData = {
  _id: string;
  studentId: string;
  lrn: string | null;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    birthDate: string;
    birthPlace: string;
    gender: "male" | "female";
    religion?: string;
  };
  contactInfo: {
    address: { street: string; barangay: string; city: string; municipality?: string; province: string; zipCode: string };
    contactNumber?: string;
  };
  guardianInfo: {
    father?: { fullName: string; occupation?: string; contactNumber?: string };
    mother?: { fullName: string; occupation?: string; contactNumber?: string };
    guardian?: { fullName: string; relationship: string; occupation?: string; contactNumber: string };
  };
  currentGradeLevel: string | null;
  status: string;
  latestEnrollment: {
    gradeLevel?: string;
    monthlyIncome?: string;
    numberOfSiblings?: string;
    parentOccupation?: string;
    parentAddress?: string;
    lastSchoolAttended?: string;
  } | null;
};

const DEFAULT_VALUES = { isCatholic: "yes" as const, enrollmentType: "new" as const, municipality: "" };


// ── Scroll-to-error helpers ────────────────────────────────────────────────────
const FIELD_SECTION_MAP: Partial<Record<keyof FormData, string>> = {
  enrollmentType: "section-student",
  gradeLevel:     "section-student",
  studentNo:      "section-student",
  lastName:       "section-student",
  firstName:      "section-student",
  middleName:     "section-student",
  birthDate:      "section-student",
  birthPlace:     "section-student",
  gender:         "section-student",
  street:         "section-student",
  barangay:       "section-student",
  city:           "section-student",
  municipality:   "section-student",
  province:       "section-student",
  zipCode:        "section-student",
  contactNo:      "section-student",
  numberOfSiblings: "section-student",
  lastSchoolAttended: "section-student",
  isCatholic:     "section-student",
  religion:       "section-student",
  guardianName:   "section-guardian",
  parentOccupation: "section-guardian",
  parentAddress:  "section-guardian",
  monthlyIncome:  "section-guardian",
  bookOption:     "section-preferences",
  bookRentalAgreed: "section-preferences",
  peUniform:      "section-preferences",
};

const SECTION_ORDER = ["section-student", "section-guardian", "section-documents", "section-preferences"];

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("ring-2", "ring-red-400", "ring-offset-2", "transition-shadow");
  setTimeout(() => el.classList.remove("ring-2", "ring-red-400", "ring-offset-2"), 2500);
}


const GRADE_ORDER = [
  "Kindergarten","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
  "Grade 7","Grade 8","Grade 9","Grade 10",
];
function nextGrade(current: string | null): string {
  if (!current) return "";
  const idx = GRADE_ORDER.indexOf(current);
  return idx >= 0 && idx < GRADE_ORDER.length - 1 ? GRADE_ORDER[idx + 1] : current;
}

export default function NewEnrollmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lrnStatus, setLrnStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const lrnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // useRef so the auto-save closure always reads the latest values without stale captures
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(true); // suppress auto-save during initial draft load
  const [children, setChildren] = useState<ChildData[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [existingStudentId, setExistingStudentId] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);

  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const isCatholic = watch("isCatholic");
  const gradeLevel = watch("gradeLevel");
  const watchedValues = watch();
  const watchBookOption = watch("bookOption");
  const watchPeUniform = watch("peUniform");

  // Fetch children when "returning" is selected
  useEffect(() => {
    if (watchedValues.enrollmentType !== "returning") {
      setChildren([]);
      setSelectedChild(null);
      setExistingStudentId(null);
      return;
    }
    setIsLoadingChildren(true);
    fetch("/api/students/my-children")
      .then((r) => r.json())
      .then((d) => setChildren(d.children ?? []))
      .catch(() => setChildren([]))
      .finally(() => setIsLoadingChildren(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.enrollmentType]);

  // On mount: fetch the single existing draft and restore it
  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await fetch("/api/enrollments?includeDrafts=1&status=draft&limit=1");
        if (!res.ok) return;
        const data = await res.json();
        const draft = data.enrollments?.[0];
        if (draft?.draftData) {
          draftIdRef.current = draft._id;
          setDraftId(draft._id);
          if (draft.draftData.uploadedDocuments?.length) {
            const docsMap: Record<string, UploadedDoc> = {};
            for (const d of draft.draftData.uploadedDocuments) {
              docsMap[d.documentType] = d;
            }
            setUploadedDocs(docsMap);
          }
          const { uploadedDocuments: _ud, ...fieldValues } = draft.draftData;
          reset({ ...DEFAULT_VALUES, ...fieldValues });
          setLastSaved(new Date(draft.updatedAt));
          toast({ title: "Draft restored", description: "Your previous progress has been loaded." });
        }
      } catch {}
      finally { isLoadingRef.current = false; }
    }
    loadDraft();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to server 2s after last change — uses refs to avoid stale closures
  useEffect(() => {
    if (isLoadingRef.current) return; // skip during initial load
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setIsSavingDraft(true);
        const res = await fetch("/api/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_draft",
            draftId: draftIdRef.current ?? undefined,
            formData: watchedValues,
            uploadedDocuments: Object.values(uploadedDocs),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.draft?.id) {
            draftIdRef.current = data.draft.id;
            setDraftId(data.draft.id);
          }
          setLastSaved(new Date());
        }
      } catch {} finally {
        setIsSavingDraft(false);
      }
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, uploadedDocs]);

  const clearDraft = async () => {
    if (draftId) {
      try { await fetch(`/api/enrollments/${draftId}`, { method: "DELETE" }); } catch {}
    }
    setDraftId(null);
    draftIdRef.current = null;
    setLastSaved(null);
    reset(DEFAULT_VALUES);
    setUploadedFiles({});
    setUploadedDocs({});
    setUploadErrors({});
    setUploadProgress({});
    setSelectedChild(null);
    setExistingStudentId(null);
    setChildren([]);
    setLrnStatus("idle");
    if (lrnTimerRef.current) clearTimeout(lrnTimerRef.current);
    toast({ title: "Form cleared", description: "All fields have been reset." });
  };

  // Upload a single file to /api/upload and return the doc object
  const checkLrn = (lrn: string) => {
    if (lrnTimerRef.current) clearTimeout(lrnTimerRef.current);
    if (!lrn || lrn.length < 12) { setLrnStatus("idle"); return; }
    setLrnStatus("checking");
    lrnTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students/check-lrn?lrn=${lrn}`);
        const data = await res.json();
        setLrnStatus(data.available ? "available" : "taken");
      } catch { setLrnStatus("idle"); }
    }, 600);
  };

  const uploadFile = (docId: string, file: File): Promise<UploadedDoc> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", docId);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((p) => ({ ...p, [docId]: pct }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("Invalid response")); }
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).error ?? "Upload failed")); }
          catch { reject(new Error("Upload failed")); }
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.open("POST", "/api/upload");
      xhr.send(fd);
    });
  };

  const handleFileSelect = async (docId: string, file: File | null) => {
    if (!file) {
      setUploadedFiles((p) => { const n = { ...p }; delete n[docId]; return n; });
      setUploadedDocs((p)  => { const n = { ...p }; delete n[docId]; return n; });
      return;
    }

    setUploadedFiles((p) => ({ ...p, [docId]: file }));
    setUploadErrors((p) => { const n = {...p}; delete n[docId]; return n; });
    setUploadProgress((p) => ({ ...p, [docId]: 0 }));
    setUploadingId(docId);
    try {
      const result = await uploadFile(docId, file);
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
    } catch (e: any) {
      setUploadErrors((p) => ({ ...p, [docId]: e.message || "Upload failed" }));
      setUploadedFiles((p) => { const n = { ...p }; delete n[docId]; return n; });
    } finally {
      setUploadingId(null);
      setUploadProgress((p) => { const n = { ...p }; delete n[docId]; return n; });
    }
  };

  const onSubmit = async (data: FormData) => {
    // Cancel any pending auto-save to prevent it from overwriting status back to "draft"
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setIsSubmitting(true);
    try {
      if (lrnStatus === "taken") {
        toast({ title: "Duplicate LRN", description: "This LRN is already registered to another student.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      // Check required documents (Kindergarten doesn't need report card or good moral)
      const isKindergarten = data.gradeLevel === "Kindergarten";
      const missingDocs = DOCUMENT_TYPES.filter(
        (d) => d.required && !uploadedDocs[d.id] && !(isKindergarten && KINDER_EXEMPT_DOCS.has(d.id))
      );
      if (missingDocs.length > 0) {
        toast({
          title: "Missing Required Documents",
          description: `Please upload: ${missingDocs.map((d) => d.label).join(", ")}`,
          variant: "destructive",
        });
        scrollToSection("section-documents");
        return;
      }

      const payload = {
        enrollmentType: data.enrollmentType,
        gradeLevel:     data.gradeLevel,
        existingStudentId: existingStudentId ?? undefined,
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
        municipality:   data.municipality,
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
        preferences: {
          bookOption: data.bookOption,
          bookRentalAgreed: data.bookOption === "rental" ? data.bookRentalAgreed : undefined,
          peUniform: data.peUniform,
        },
      };

      // Capture draftId then clear refs so auto-save cannot fire after submission
      const submittingDraftId = draftIdRef.current;
      draftIdRef.current = null;
      setDraftId(null);

      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, draftId: submittingDraftId ?? undefined }),
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

  const onInvalid = (errs: FieldErrors<FormData>) => {
    const errorFields = Object.keys(errs) as (keyof FormData)[];
    for (const sectionId of SECTION_ORDER) {
      if (errorFields.some((f) => FIELD_SECTION_MAP[f] === sectionId)) {
        scrollToSection(sectionId);
        break;
      }
    }
  };

  const selectChild = (child: ChildData) => {
    setSelectedChild(child);
    setExistingStudentId(child._id);
    const guardian = child.guardianInfo?.guardian
      ?? (child.guardianInfo?.father ? { ...child.guardianInfo.father, relationship: "Father" } : null)
      ?? (child.guardianInfo?.mother ? { ...child.guardianInfo.mother, relationship: "Mother" } : null);
    const guardianName = guardian?.fullName ?? "";
    const contactNo = child.contactInfo?.contactNumber ?? (guardian && "contactNumber" in guardian ? guardian.contactNumber : "") ?? "";
    const religion = child.personalInfo?.religion ?? "";
    const isCatholicVal = (!religion || religion.toLowerCase() === "catholic") ? "yes" as const : "no" as const;
    const suggestedGrade = nextGrade(child.currentGradeLevel);
    const bd = child.personalInfo?.birthDate ? new Date(child.personalInfo.birthDate).toISOString().split("T")[0] : "";
    const le = child.latestEnrollment;
    reset({
      enrollmentType: "returning",
      gradeLevel: suggestedGrade || "",
      studentNo: child.lrn ?? "",
      lastName: child.personalInfo?.lastName ?? "",
      firstName: child.personalInfo?.firstName ?? "",
      middleName: child.personalInfo?.middleName ?? "",
      birthDate: bd,
      birthPlace: child.personalInfo?.birthPlace ?? "",
      gender: child.personalInfo?.gender ?? undefined,
      isCatholic: isCatholicVal,
      religion: isCatholicVal === "no" ? religion : undefined,
      street: child.contactInfo?.address?.street ?? "",
      barangay: child.contactInfo?.address?.barangay ?? "",
      city: child.contactInfo?.address?.city ?? "",
      municipality: child.contactInfo?.address?.municipality ?? "",
      province: child.contactInfo?.address?.province ?? "",
      zipCode: child.contactInfo?.address?.zipCode ?? "",
      contactNo: typeof contactNo === "string" ? contactNo : "",
      guardianName,
      monthlyIncome: le?.monthlyIncome ?? "",
      numberOfSiblings: le?.numberOfSiblings ?? "",
      parentOccupation: le?.parentOccupation ?? "",
      parentAddress: le?.parentAddress ?? "",
      lastSchoolAttended: le?.lastSchoolAttended ?? "CTK Learning Center",
    });
  };

  const labelCls = "block text-xs font-medium text-gray-700";
  const errorCls = "mt-0.5 text-xs text-red-500";

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Enrollment</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isSavingDraft
              ? "Saving draft…"
              : lastSaved
              ? `Draft saved · ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Fill out the form to enroll a student"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {draftId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 text-sm text-red-600 border-red-200 hover:bg-red-50"
              onClick={clearDraft}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Link href="/parent/enrollments">
            <Button variant="outline" size="sm" className="h-10 text-sm">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} autoComplete="off" className="space-y-4">
        {/* ── Student Information ───────────────────────────────── */}
        <Card id="section-student" className="scroll-mt-4">
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

            {/* ── Returning Student: Child Selector ──────────────── */}
            {watchedValues.enrollmentType === "returning" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-800">Select Your Child</p>
                </div>

                {isLoadingChildren && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading children…
                  </div>
                )}

                {!isLoadingChildren && children.length === 0 && (
                  <p className="text-xs text-blue-700">
                    No children found linked to your account. Please use <strong>New Student</strong> enrollment type.
                  </p>
                )}

                {!isLoadingChildren && children.length > 0 && (
                  <div className="space-y-2">
                    {children.map((child) => {
                      const isSelected = selectedChild?._id === child._id;
                      const fullName = `${child.personalInfo?.lastName ?? ""}, ${child.personalInfo?.firstName ?? ""}${child.personalInfo?.middleName ? " " + child.personalInfo.middleName : ""}`.trim();
                      return (
                        <button
                          key={child._id}
                          type="button"
                          onClick={() => selectChild(child)}
                          className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-100 ring-1 ring-blue-400"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-800">{fullName}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="neutral" className="text-xs h-4 px-1.5">
                                {child.currentGradeLevel ?? "No grade"}
                              </Badge>
                              {child.lrn && (
                                <span className="text-xs text-slate-500">LRN: {child.lrn}</span>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedChild && (
                  <p className="text-xs text-blue-700 bg-blue-100 rounded-md px-3 py-2">
                    ✓ Form auto-filled from <strong>{selectedChild.personalInfo?.firstName}&apos;s</strong> profile. Review and update if needed.
                  </p>
                )}
              </div>
            )}

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
                <Input
                  {...register("studentNo")}
                  placeholder="Leave blank if new"
                  className="mt-1 h-8 text-sm"
                  onChange={(e) => {
                    register("studentNo").onChange(e);
                    checkLrn(e.target.value.trim());
                  }}
                />
                {lrnStatus === "checking" && <p className="text-xs text-slate-400 mt-0.5">Checking LRN…</p>}
                {lrnStatus === "available" && <p className="text-xs text-green-600 mt-0.5">✓ LRN is available</p>}
                {lrnStatus === "taken" && <p className="text-xs text-red-600 mt-0.5">✗ This LRN is already registered to another student</p>}
                {lrnStatus === "idle" && <p className="text-xs text-muted-foreground mt-0.5">LRN must be exactly 12 digits (if applicable)</p>}
                {errors.studentNo && (
                  <p className="text-xs text-red-600 mt-1">{errors.studentNo.message}</p>
                )}
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
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Barangay <span className="text-red-500">*</span></label>
                <Controller
                  name="barangay"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={BARANGAYS.map((b) => ({ value: b, label: b }))}
                      placeholder="Select Barangay"
                      className="mt-1"
                    />
                  )}
                />
                {errors.barangay && <p className={errorCls}>{errors.barangay.message}</p>}
              </div>

              <div>
                <label className={labelCls}>City <span className="text-red-500">*</span></label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={CITIES.map((c) => ({ value: c, label: c }))}
                      placeholder="Select City"
                      className="mt-1"
                    />
                  )}
                />
                {errors.city && <p className={errorCls}>{errors.city.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Municipality <span className="text-red-500">*</span></label>
                <Controller
                  name="municipality"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={MUNICIPALITIES.map((m) => ({ value: m, label: m }))}
                      placeholder="Select Municipality"
                      className="mt-1"
                    />
                  )}
                />
                {errors.municipality && <p className={errorCls}>{errors.municipality.message}</p>}
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

            {/* Non-Catholic waiver notice + optional upload */}
            {isCatholic === "no" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-amber-800">Non-Catholic Agreement Required</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    As a non-Catholic student enrolling in CTK, a signed agreement form is required.
                    You may upload the signed form now, or bring it in person when you pay.
                  </p>
                </div>
                <a
                  href="/non-catholic-agreement.docx"
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Agreement Form (DOCX)
                </a>
                <div>
                  <p className="text-xs text-amber-700 mb-1.5">Upload signed waiver <span className="text-gray-500">(optional — you may submit in person at payment)</span></p>
                  {uploadedDocs["non_catholic_agreement"] ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-300 bg-green-50 p-2">
                      <div className="flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[200px]">{uploadedFiles["non_catholic_agreement"]?.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 text-sm ml-2"
                        onClick={() => {
                          setUploadedFiles((p) => { const n = { ...p }; delete n["non_catholic_agreement"]; return n; });
                          setUploadedDocs((p)  => { const n = { ...p }; delete n["non_catholic_agreement"]; return n; });
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 text-sm border-amber-300 text-amber-800 hover:bg-amber-100"
                      disabled={uploadingId === "non_catholic_agreement"}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ACCEPT_FILE_INPUT;
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileSelect("non_catholic_agreement", file);
                        };
                        input.click();
                      }}
                    >
                      {uploadingId === "non_catholic_agreement"
                        ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading...</>
                        : <><Upload className="h-3 w-3 mr-1" />Upload Signed Waiver</>
                      }
                    </Button>
                  )}
                  {uploadErrors["non_catholic_agreement"] && (
                    <p className="mt-1 text-xs text-red-600">{uploadErrors["non_catholic_agreement"]}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Parent / Guardian Information ───────────────────── */}
        <Card id="section-guardian" className="scroll-mt-4">
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
        <Card id="section-documents" className="scroll-mt-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Required Documents</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {DOCUMENT_TYPES.map((doc) => {
                const uploaded = !!uploadedDocs[doc.id];
                const isUploading = uploadingId === doc.id;
                return (
                  <div key={doc.id} className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${uploaded ? "border-green-300 bg-green-50" : uploadErrors[doc.id] ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {doc.label}
                        {doc.required && !(gradeLevel === "Kindergarten" && KINDER_EXEMPT_DOCS.has(doc.id)) && <span className="ml-1 text-red-500 text-xs">*</span>}
                        {gradeLevel === "Kindergarten" && KINDER_EXEMPT_DOCS.has(doc.id) && <span className="ml-1 text-gray-400 text-xs">(not required for Kindergarten)</span>}
                      </p>
                      {uploaded && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{uploadedFiles[doc.id]?.name}</span>
                        </div>
                      )}
                      {uploadProgress[doc.id] !== undefined && uploadProgress[doc.id] < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-[#b4040d] h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress[doc.id]}%` }} />
                        </div>
                      )}
                      {uploadErrors[doc.id] && (
                        <p className="mt-0.5 text-xs text-red-600">{uploadErrors[doc.id]}</p>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {uploaded ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 text-sm"
                          onClick={() => {
                            setUploadedFiles((p) => { const n = { ...p }; delete n[doc.id]; return n; });
                            setUploadedDocs((p)  => { const n = { ...p }; delete n[doc.id]; return n; });
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />Remove
                        </Button>
                      ) : uploadErrors[doc.id] ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 text-sm border-red-300 text-red-600 hover:bg-red-50"
                          disabled={isUploading}
                          onClick={() => {
                            if (uploadedFiles[doc.id]) {
                              handleFileSelect(doc.id, uploadedFiles[doc.id]);
                            } else {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ACCEPT_FILE_INPUT;
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleFileSelect(doc.id, file);
                              };
                              input.click();
                            }
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />Retry
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 text-sm"
                          disabled={isUploading}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ACCEPT_FILE_INPUT;
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


        {/* ── Book & PE Uniform Preferences ───────────────────── */}
        <Card id="section-preferences" className="scroll-mt-4">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold">Book & Uniform Preferences</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-5">

            {/* Book Option */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Books <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: "purchase_new",       label: "Buying — Purchase of New Books",            desc: null },
                  { value: "purchase_secondhand", label: "Buying — Purchase of Second Hand Textbooks", desc: null },
                  { value: "rental",              label: "Rental",                                     desc: null },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      watchBookOption === value ? "border-[#b4040d] bg-red-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Controller
                      name="bookOption"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="radio"
                          className="accent-[#b4040d]"
                          value={value}
                          checked={field.value === value}
                          onChange={() => field.onChange(value)}
                        />
                      )}
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {errors.bookOption && <p className="text-xs text-red-500">{errors.bookOption.message}</p>}

              {/* Rental Terms */}
              {watchBookOption === "rental" && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800">Book Rental Terms & Agreement</p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Books are provided on a rental basis for the current school year only.</li>
                    <li>Students are responsible for keeping books in good condition.</li>
                    <li>Damaged or lost books must be replaced or paid for by the student/guardian.</li>
                    <li>Books must be returned at the end of the school year in satisfactory condition.</li>
                    <li>Rental fees are non-refundable once the books have been issued.</li>
                  </ul>
                  <Controller
                    name="bookRentalAgreed"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[#b4040d]"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <span className="text-xs text-amber-800 font-medium">I have read and agree to the book rental terms above.</span>
                      </label>
                    )}
                  />
                  {errors.bookRentalAgreed && <p className="text-xs text-red-500">{errors.bookRentalAgreed.message}</p>}
                </div>
              )}
            </div>

            {/* PE Uniform */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">PE Uniform <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "add",  label: "Add PE Uniform" },
                  { value: "skip", label: "No PE Uniform"  },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      watchPeUniform === value ? "border-[#b4040d] bg-red-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Controller
                      name="peUniform"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="radio"
                          className="accent-[#b4040d]"
                          value={value}
                          checked={field.value === value}
                          onChange={() => field.onChange(value)}
                        />
                      )}
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {errors.peUniform && <p className="text-xs text-red-500">{errors.peUniform.message}</p>}
            </div>

          </CardContent>
        </Card>

        {/* ── Submit ───────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Link href="/parent/enrollments">
            <Button type="button" variant="outline" size="sm" disabled={isSubmitting} className="h-10 text-sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || uploadingId !== null}
            className="h-10 text-sm bg-[#b4040d] hover:bg-[#8a0309]"
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
