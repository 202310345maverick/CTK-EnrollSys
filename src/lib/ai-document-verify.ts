import { v2 as cloudinary } from "cloudinary";

// Cloudinary is already configured via CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
// This module uses Cloudinary's OCR add-on (adv_ocr) — free tier: 500 requests/month.
// Enable it once at: Cloudinary Dashboard → Add-ons → OCR Text Detection and Extraction

export type AIDocumentStatus = "passed" | "flagged" | "needs_review" | "skipped" | "error";

export interface AIAnalysisResult {
  status: AIDocumentStatus;
  extractedText: string;
  confidence: number;
  documentTypeDetected: string | null;
  documentTypeMatch: boolean | null;
  studentNameFound: boolean | null;
  qualityFlags: string[];
  analyzedAt: Date;
  error?: string;
}

const DOC_KEYWORDS: Record<string, string[]> = {
  psa_birth_certificate: [
    "PSA", "PHILIPPINE STATISTICS AUTHORITY", "BIRTH CERTIFICATE",
    "CERTIFICATE OF LIVE BIRTH", "CIVIL REGISTRY", "REPUBLIC OF THE PHILIPPINES",
  ],
  report_card: [
    "REPORT CARD", "SCHOOL FORM", "GRADES", "DEPARTMENT OF EDUCATION", "DEPED", "SF9", "SF 9",
  ],
  good_moral: [
    "GOOD MORAL", "CHARACTER", "CONDUCT", "CERTIFICATE", "HEREBY CERTIFY",
  ],
  transfer_certificate: [
    "TRANSFER CERTIFICATE", "HONORABLE DISMISSAL", "CERTIFICATE OF TRANSFER",
  ],
  non_catholic_agreement: [
    "NON-CATHOLIC", "NON CATHOLIC", "AGREEMENT", "PERMISSION", "CONSENT",
  ],
  id_photo: [],
  other: [],
};

function detectDocumentType(text: string): string | null {
  const upperText = text.toUpperCase();
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const [docType, keywords] of Object.entries(DOC_KEYWORDS)) {
    if (keywords.length === 0) continue;
    const score = keywords.filter((k) => upperText.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = docType;
    }
  }
  return bestScore > 0 ? bestMatch : null;
}

function checkStudentName(text: string, studentName: string): boolean {
  const upperText = text.toUpperCase();
  const nameParts = studentName.toUpperCase().split(/\s+/).filter((p) => p.length > 2);
  if (nameParts.length === 0) return false;
  const matchCount = nameParts.filter((p) => upperText.includes(p)).length;
  return matchCount >= Math.ceil(nameParts.length / 2);
}

export async function analyzeDocument(params: {
  cloudinaryPublicId: string;
  mimeType: string;
  expectedDocumentType: string;
  studentName?: string;
}): Promise<AIAnalysisResult> {
  // PDF files: Cloudinary OCR only works on images
  if (params.mimeType === "application/pdf") {
    return {
      status: "skipped",
      extractedText: "",
      confidence: 0,
      documentTypeDetected: null,
      documentTypeMatch: null,
      studentNameFound: null,
      qualityFlags: ["pdf_not_supported"],
      analyzedAt: new Date(),
    };
  }

  try {
    // Request OCR from Cloudinary using the adv_ocr add-on
    const result = await cloudinary.api.resource(params.cloudinaryPublicId, {
      ocr: "adv_ocr",
    }) as any;

    const ocrData = result?.info?.ocr?.adv_ocr?.data?.[0];
    const extractedText: string = ocrData?.full_text_annotation?.text ?? "";
    const wordConfidences: number[] = (ocrData?.full_text_annotation?.pages ?? [])
      .flatMap((p: any) => p.blocks ?? [])
      .flatMap((b: any) => b.paragraphs ?? [])
      .flatMap((para: any) => para.words ?? [])
      .map((w: any) => (typeof w.confidence === "number" ? w.confidence : 1));

    const avgConfidence =
      wordConfidences.length > 0
        ? wordConfidences.reduce((a: number, b: number) => a + b, 0) / wordConfidences.length
        : extractedText.length > 50
        ? 0.8
        : 0.3;

    const qualityFlags: string[] = [];

    const expectedKeywords = DOC_KEYWORDS[params.expectedDocumentType];
    if (expectedKeywords && expectedKeywords.length > 0 && extractedText.length < 50) {
      qualityFlags.push("blank_or_unreadable");
    }

    const documentTypeDetected = detectDocumentType(extractedText);
    let documentTypeMatch: boolean | null = null;
    if (documentTypeDetected !== null) {
      documentTypeMatch = documentTypeDetected === params.expectedDocumentType;
      if (!documentTypeMatch) qualityFlags.push("wrong_document_type");
    } else if (expectedKeywords && expectedKeywords.length > 0 && extractedText.length > 50) {
      qualityFlags.push("document_type_unclear");
    }

    let studentNameFound: boolean | null = null;
    if (params.studentName && extractedText.length > 20) {
      studentNameFound = checkStudentName(extractedText, params.studentName);
      if (!studentNameFound) qualityFlags.push("student_name_not_found");
    }

    const status: AIDocumentStatus =
      qualityFlags.length === 0
        ? "passed"
        : qualityFlags.includes("wrong_document_type")
        ? "flagged"
        : "needs_review";

    return {
      status,
      extractedText: extractedText.slice(0, 2000),
      confidence: Math.round(avgConfidence * 100) / 100,
      documentTypeDetected,
      documentTypeMatch,
      studentNameFound,
      qualityFlags,
      analyzedAt: new Date(),
    };
  } catch (error: any) {
    // If the OCR add-on is not enabled, Cloudinary returns an error — treat as skipped
    const message: string = error?.message ?? "Unknown error";
    const isAddonMissing =
      message.includes("OCR") ||
      message.includes("adv_ocr") ||
      message.includes("not found") ||
      message.includes("not enabled");

    return {
      status: isAddonMissing ? "skipped" : "error",
      extractedText: "",
      confidence: 0,
      documentTypeDetected: null,
      documentTypeMatch: null,
      studentNameFound: null,
      qualityFlags: isAddonMissing ? ["ocr_addon_not_enabled"] : [],
      analyzedAt: new Date(),
      error: isAddonMissing ? undefined : message,
    };
  }
}
