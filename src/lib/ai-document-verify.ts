import { v2 as cloudinary } from "cloudinary";

// Cloudinary is already configured via CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
// Uses Cloudinary's OCR add-on (adv_ocr) triggered at upload time.
// Enable at: Cloudinary Dashboard → Add-ons → OCR Text Detection and Extraction
// Free tier: 500 requests/month

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
  good_moral: ["GOOD MORAL", "CHARACTER", "CONDUCT", "CERTIFICATE", "HEREBY CERTIFY"],
  transfer_certificate: ["TRANSFER CERTIFICATE", "HONORABLE DISMISSAL", "CERTIFICATE OF TRANSFER"],
  non_catholic_agreement: ["NON-CATHOLIC", "NON CATHOLIC", "AGREEMENT", "PERMISSION", "CONSENT"],
  id_photo: [],
  other: [],
};

function detectDocumentType(text: string): string | null {
  const upper = text.toUpperCase();
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const [docType, keywords] of Object.entries(DOC_KEYWORDS)) {
    if (!keywords.length) continue;
    const score = keywords.filter((k) => upper.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestMatch = docType; }
  }
  return bestScore > 0 ? bestMatch : null;
}

function checkStudentName(text: string, studentName: string): boolean {
  const upper = text.toUpperCase();
  const parts = studentName.toUpperCase().split(/\s+/).filter((p) => p.length > 2);
  if (!parts.length) return false;
  return parts.filter((p) => upper.includes(p)).length >= Math.ceil(parts.length / 2);
}

function extractFromOcrInfo(ocrInfo: any): { text: string; confidence: number } {
  const ocrData = ocrInfo?.ocr?.adv_ocr?.data?.[0];
  const text: string = ocrData?.full_text_annotation?.text ?? "";
  const wordConfidences: number[] = (ocrData?.full_text_annotation?.pages ?? [])
    .flatMap((p: any) => p.blocks ?? [])
    .flatMap((b: any) => b.paragraphs ?? [])
    .flatMap((para: any) => para.words ?? [])
    .map((w: any) => (typeof w.confidence === "number" ? w.confidence : 1));
  const confidence =
    wordConfidences.length > 0
      ? wordConfidences.reduce((a: number, b: number) => a + b, 0) / wordConfidences.length
      : text.length > 50 ? 0.8 : 0.3;
  return { text, confidence };
}

export async function analyzeDocument(params: {
  cloudinaryPublicId: string;
  cloudinaryResourceType?: string;
  mimeType: string;
  expectedDocumentType: string;
  studentName?: string;
  uploadOcrInfo?: any; // OCR info from upload result (preferred, avoids extra API call)
}): Promise<AIAnalysisResult> {
  try {
    let extractedText = "";
    let confidence = 0;

    // If OCR info was passed from the upload result, use it directly
    if (params.uploadOcrInfo?.ocr?.adv_ocr) {
      const extracted = extractFromOcrInfo(params.uploadOcrInfo);
      extractedText = extracted.text;
      confidence = extracted.confidence;
    } else {
      // Fallback: call Cloudinary explicit to trigger OCR on existing resource
      try {
        const explicit = await cloudinary.uploader.explicit(
          params.cloudinaryPublicId,
          { type: "upload", resource_type: (params.cloudinaryResourceType || "image") as any, ocr: "adv_ocr" }
        ) as any;
        const extracted = extractFromOcrInfo(explicit.info);
        extractedText = extracted.text;
        confidence = extracted.confidence;
      } catch (ocrErr: any) {
        const msg: string = ocrErr?.message ?? "";
        const isAddonMissing = msg.includes("OCR") || msg.includes("adv_ocr") || msg.includes("not enabled");
        return {
          status: isAddonMissing ? "skipped" : "error",
          extractedText: "",
          confidence: 0,
          documentTypeDetected: null,
          documentTypeMatch: null,
          studentNameFound: null,
          qualityFlags: isAddonMissing ? ["ocr_addon_not_enabled"] : [],
          analyzedAt: new Date(),
          error: isAddonMissing ? undefined : msg,
        };
      }
    }

    const qualityFlags: string[] = [];
    const expectedKeywords = DOC_KEYWORDS[params.expectedDocumentType];

    if (expectedKeywords?.length && extractedText.length < 50) {
      qualityFlags.push("blank_or_unreadable");
    }

    const documentTypeDetected = detectDocumentType(extractedText);
    let documentTypeMatch: boolean | null = null;
    if (documentTypeDetected !== null) {
      documentTypeMatch = documentTypeDetected === params.expectedDocumentType;
      if (!documentTypeMatch) qualityFlags.push("wrong_document_type");
    } else if (expectedKeywords?.length && extractedText.length > 50) {
      qualityFlags.push("document_type_unclear");
    }

    let studentNameFound: boolean | null = null;
    if (params.studentName && extractedText.length > 20) {
      studentNameFound = checkStudentName(extractedText, params.studentName);
      if (!studentNameFound) qualityFlags.push("student_name_not_found");
    }

    const status: AIDocumentStatus =
      qualityFlags.length === 0 ? "passed"
      : qualityFlags.includes("wrong_document_type") ? "flagged"
      : "needs_review";

    return {
      status,
      extractedText: extractedText.slice(0, 2000),
      confidence: Math.round(confidence * 100) / 100,
      documentTypeDetected,
      documentTypeMatch,
      studentNameFound,
      qualityFlags,
      analyzedAt: new Date(),
    };
  } catch (error: any) {
    return {
      status: "error",
      extractedText: "",
      confidence: 0,
      documentTypeDetected: null,
      documentTypeMatch: null,
      studentNameFound: null,
      qualityFlags: [],
      analyzedAt: new Date(),
      error: error?.message ?? "Unknown error",
    };
  }
}
