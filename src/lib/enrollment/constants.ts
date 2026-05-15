export const ENROLLMENT_DOCUMENT_TYPES = [
  "report_card",
  "psa_birth_certificate",
  "good_moral",
  "id_photo",
  "transfer_certificate",
  "other",
] as const;

export type EnrollmentDocumentType = (typeof ENROLLMENT_DOCUMENT_TYPES)[number];

export const ENROLLMENT_DOCUMENT_LABELS: Record<EnrollmentDocumentType, string> = {
  report_card: "Report Card (Latest)",
  psa_birth_certificate: "PSA Birth Certificate",
  good_moral: "Good Moral Certificate",
  id_photo: "2x2 ID Photo",
  transfer_certificate: "Transfer Credentials (Form 137)",
  other: "Other Supporting Document",
};

export function getRequiredDocumentTypes(
  enrollmentType: "new" | "returning" | "transferee"
): EnrollmentDocumentType[] {
  const baseRequired: EnrollmentDocumentType[] = [
    "report_card",
    "psa_birth_certificate",
    "good_moral",
    "id_photo",
  ];

  if (enrollmentType === "transferee") {
    return [...baseRequired, "transfer_certificate"];
  }

  return baseRequired;
}
