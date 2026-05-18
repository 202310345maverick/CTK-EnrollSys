"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Upload, CheckCircle2, CircleAlert } from "lucide-react";

import { ENROLLMENT_DOCUMENT_LABELS, type EnrollmentDocumentType } from "@/lib/enrollment/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

type DashboardDocument = {
  type: string;
  label: string;
  status: "missing" | "pending" | "verified" | "rejected";
  uploadedAt?: string | Date | null;
  downloadUrl?: string | null;
  filename?: string | null;
};

type ParentDashboardDocumentsProps = {
  enrollmentId: string;
  documents: DashboardDocument[];
};

export default function ParentDashboardDocuments({
  enrollmentId,
  documents,
}: ParentDashboardDocumentsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const openUploader = (documentType: string) => {
    const input = document.getElementById(`parent-doc-${documentType}`) as HTMLInputElement | null;
    input?.click();
  };

  const uploadDocument = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: string
  ) => {
    const file = event.target.files?.[0];
    if (!file || !enrollmentId) {
      return;
    }

    setUploadingType(documentType);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await fetch(`/api/enrollments/${enrollmentId}/documents`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload document.");
      }

      toast({
        variant: "success",
        title: "Document uploaded",
        description: `${ENROLLMENT_DOCUMENT_LABELS[documentType as keyof typeof ENROLLMENT_DOCUMENT_LABELS] ?? documentType} was attached to your enrollment.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file.",
      });
    } finally {
      setUploadingType(null);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const isUploaded = document.status === "pending" || document.status === "verified";
        const uploadedDate =
          document.uploadedAt && !Number.isNaN(new Date(document.uploadedAt).getTime())
            ? new Date(document.uploadedAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null;

        return (
          <div
            key={document.type}
            className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className={cn("shrink-0 rounded-lg p-1.5", isUploaded ? "bg-emerald-100" : "bg-orange-100")}>
                {isUploaded ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <CircleAlert className="h-3.5 w-3.5 text-orange-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-800">{document.label}</p>
                <p className="truncate text-xs text-slate-500">
                  {isUploaded
                    ? `Uploaded${uploadedDate ? `: ${uploadedDate}` : ""}${document.filename ? ` • ${document.filename}` : ""}`
                    : "Not uploaded yet"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {document.downloadUrl ? (
                <a
                  href={document.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </a>
              ) : null}
              <input
                id={`parent-doc-${document.type}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) => uploadDocument(event, document.type)}
              />
              <Button
                type="button"
                size="sm"
                className="ctk-danger-button h-7 px-2 text-xs"
                onClick={() => openUploader(document.type)}
                disabled={uploadingType === document.type}
              >
                {uploadingType === document.type ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {isUploaded ? "Replace" : "Upload"}
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/40 p-3 text-center text-xs font-medium text-slate-600">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white/80 text-xs h-7"
          onClick={() => openUploader("other")}
          disabled={uploadingType === "other"}
        >
          {uploadingType === "other" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Additional Documents
            </>
          )}
        </Button>
        <input
          id="parent-doc-other"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(event) => uploadDocument(event, "other")}
        />
      </div>
    </div>
  );
}
