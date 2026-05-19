"use client";

import { useState } from "react";
import { FileText, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  url: string;
  name?: string;
  mime?: string;
  label?: string;
  asButton?: boolean;
}

export function DocumentViewer({ url, name = "Document", mime, label = "View", asButton }: DocumentViewerProps) {
  const [open, setOpen] = useState(false);
  const isPdf = mime === "application/pdf" || url.toLowerCase().includes(".pdf");

  return (
    <>
      {asButton ? (
        <Button variant="outline" size="sm" className="h-6 px-1.5 text-xs gap-1" onClick={() => setOpen(true)}>
          <FileText className="h-3 w-3" /> {label}
        </Button>
      ) : (
        <button onClick={() => setOpen(true)} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <FileText className="mr-1 h-4 w-4" />
          {label}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <p className="text-sm font-semibold truncate max-w-[60%]">{name}</p>
              <div className="flex items-center gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Open in new tab
                </a>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto min-h-0 rounded-b-xl bg-slate-100">
              {isPdf ? (
                <iframe src={url} className="w-full h-[75vh] rounded-b-xl border-0" title={name} />
              ) : (
                <div className="flex items-center justify-center p-4 min-h-[400px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
