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
  imageUrl: string;
  mimeType: string;
  expectedDocumentType: string;
  studentName?: string;
}): Promise<AIAnalysisResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return {
      status: "skipped",
      extractedText: "",
      confidence: 0,
      documentTypeDetected: null,
      documentTypeMatch: null,
      studentNameFound: null,
      qualityFlags: ["api_key_not_configured"],
      analyzedAt: new Date(),
    };
  }

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
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: params.imageUrl } },
              features: [
                { type: "TEXT_DETECTION", maxResults: 1 },
                { type: "SAFE_SEARCH_DETECTION" },
                { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Vision API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const result = data.responses?.[0];

    if (!result) throw new Error("Empty response from Vision API");
    if (result.error) throw new Error(result.error.message);

    const extractedText =
      result.fullTextAnnotation?.text ||
      result.textAnnotations?.[0]?.description ||
      "";

    const safeSearch = result.safeSearchAnnotation || {};
    const qualityFlags: string[] = [];

    const highLikelihood = ["LIKELY", "VERY_LIKELY"];
    if (
      highLikelihood.includes(safeSearch.adult) ||
      highLikelihood.includes(safeSearch.violence)
    ) {
      qualityFlags.push("inappropriate_content");
    }

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

    // Compute average word-level confidence from full text annotation
    const wordConfidences: number[] = (result.fullTextAnnotation?.pages ?? [])
      .flatMap((p: any) => p.blocks ?? [])
      .flatMap((b: any) => b.paragraphs ?? [])
      .flatMap((para: any) => para.words ?? [])
      .map((w: any) => (typeof w.confidence === "number" ? w.confidence : 1));

    const avgConfidence =
      wordConfidences.length > 0
        ? wordConfidences.reduce((a, b) => a + b, 0) / wordConfidences.length
        : extractedText.length > 50
        ? 0.8
        : 0.3;

    const status: AIDocumentStatus =
      qualityFlags.length === 0
        ? "passed"
        : qualityFlags.includes("inappropriate_content") ||
          qualityFlags.includes("wrong_document_type")
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
  } catch (error) {
    return {
      status: "error",
      extractedText: "",
      confidence: 0,
      documentTypeDetected: null,
      documentTypeMatch: null,
      studentNameFound: null,
      qualityFlags: [],
      analyzedAt: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
