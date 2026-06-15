import { createWorker } from "tesseract.js";

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
    "PSA",
    "PHILIPPINE STATISTICS AUTHORITY",
    "BIRTH CERTIFICATE",
    "CERTIFICATE OF LIVE BIRTH",
    "CIVIL REGISTRY",
    "REPUBLIC OF THE PHILIPPINES",
  ],
  report_card: [
    "REPORT CARD",
    "SCHOOL FORM",
    "GRADES",
    "DEPARTMENT OF EDUCATION",
    "DEPED",
    "SF9",
    "SF 9",
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
    if (score > bestScore) {
      bestScore = score;
      bestMatch = docType;
    }
  }
  return bestScore > 0 ? bestMatch : null;
}

function checkStudentName(text: string, studentName: string): boolean {
  const upper = text.toUpperCase();
  const parts = studentName.toUpperCase().split(/\s+/).filter((p) => p.length > 2);
  if (!parts.length) return false;
  return parts.filter((p) => upper.includes(p)).length >= Math.ceil(parts.length / 2);
}

export async function analyzeDocumentLocal(params: {
  buffer: Buffer;
  mimeType: string;
  expectedDocumentType: string;
  studentName?: string;
}): Promise<AIAnalysisResult> {
  try {
    // Tesseract.js cannot reliably OCR PDFs without page rasterization. Skip PDFs here.
    if (params.mimeType === "application/pdf") {
      return {
        status: "skipped",
        extractedText: "",
        confidence: 0,
        documentTypeDetected: null,
        documentTypeMatch: null,
        studentNameFound: null,
        qualityFlags: ["pdf_not_supported_local_ocr"],
        analyzedAt: new Date(),
      };
    }

    const worker = await createWorker();
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    const { data } = await worker.recognize(params.buffer as any);
    const text: string = data?.text ?? "";

    const wordConfidences: number[] = (data?.words ?? [])
      .map((w: any) => (typeof w.confidence === "number" ? w.confidence / 100 : 0.5));
    const confidence =
      wordConfidences.length > 0
        ? wordConfidences.reduce((a: number, b: number) => a + b, 0) / wordConfidences.length
        : text.length > 50
        ? 0.8
        : 0.3;

    await worker.terminate();

    const qualityFlags: string[] = [];
    const expectedKeywords = DOC_KEYWORDS[params.expectedDocumentType];

    if (expectedKeywords?.length && text.length < 50) {
      qualityFlags.push("blank_or_unreadable");
    }

    const documentTypeDetected = detectDocumentType(text);
    let documentTypeMatch: boolean | null = null;
    if (documentTypeDetected !== null) {
      documentTypeMatch = documentTypeDetected === params.expectedDocumentType;
      if (!documentTypeMatch) qualityFlags.push("wrong_document_type");
    } else if (expectedKeywords?.length && text.length > 50) {
      qualityFlags.push("document_type_unclear");
    }

    let studentNameFound: boolean | null = null;
    if (params.studentName && text.length > 20) {
      studentNameFound = checkStudentName(text, params.studentName);
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
      extractedText: text.slice(0, 2000),
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
