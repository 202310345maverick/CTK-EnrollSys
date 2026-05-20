"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface DocumentUploadButtonProps {
  enrollmentId: string;
  documentType: string;
  isMissing?: boolean;
}

export function DocumentUploadButton({
  enrollmentId,
  documentType,
  isMissing = false,
}: DocumentUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const busy = isPending || isUploading;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", documentType);
      const res = await fetch(`/api/enrollments/${enrollmentId}/documents`, {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Upload failed", description: result.error || "Something went wrong.", variant: "destructive" });
        return;
      }
      toast({ title: "Document uploaded", description: "Your document has been submitted." });
      startTransition(() => { router.refresh(); });
    } catch {
      toast({ title: "Upload failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
      <Button
        size="sm"
        variant={isMissing ? "default" : "outline"}
        className="h-7 gap-1 text-xs"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
        {busy ? "Uploading…" : isMissing ? "Upload" : "Re-upload"}
      </Button>
    </>
  );
}
