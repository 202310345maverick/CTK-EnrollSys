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
  thumbnail?: boolean;
  /** Optional JSX rendered in a footer bar inside the modal */
  actions?: React.ReactNode;
}

export function DocumentViewer({ url, name = "Document", mime, label = "View", asButton, thumbnail, actions }: DocumentViewerProps) {
  const [open, setOpen] = useState(false);
  const isPdf = mime === "application/pdf" || url.toLowerCase().includes(".pdf");
  const isImage = !isPdf && (mime?.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(url));

  return (
    <>
      {thumbnail ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group block w-full rounded-lg border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:border-primary/60 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-slate-100">
              {isPdf ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-red-50 text-red-600">
                  <FileText className="h-6 w-6" />
                  <span className="text-[9px] font-semibold uppercase">PDF</span>
                </div>
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-500">
                  <FileText className="h-6 w-6" />
                  <span className="text-[9px] font-semibold uppercase">FILE</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{name}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{isPdf ? "PDF document" : "Submitted file"}</p>
            </div>
          </div>
        </button>
      ) : asButton ? (
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
            {/* Header */}
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

            {/* Document preview */}
            <div className={`flex-1 overflow-auto min-h-0 bg-slate-100 ${actions ? "" : "rounded-b-xl"}`}>
              {isPdf ? (
                <iframe src={url} className="w-full h-[65vh] border-0" title={name} />
              ) : (
                <div className="flex items-center justify-center p-4 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={name} className="max-w-full max-h-[60vh] object-contain rounded-lg shadow" />
                </div>
              )}
            </div>

            {/* Actions footer — only rendered when actions prop is provided */}
            {actions && (
              <div className="border-t bg-white px-4 py-3 rounded-b-xl shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
