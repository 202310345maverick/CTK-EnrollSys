import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import { generateId } from "@/lib/utils";
import Enrollment from "@/models/Enrollment";
import Student from "@/models/Student";
import SchoolYear from "@/models/SchoolYear";
import Document from "@/models/Document";
import {
  ENROLLMENT_DOCUMENT_TYPES,
  EnrollmentDocumentType,
  getRequiredDocumentTypes,
} from "@/lib/enrollment/constants";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { sendEnrollmentSubmittedEmail } from "@/lib/auth/email";
import { createAuditLog } from "@/lib/audit";
import { sanitizeObject } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

type EnrollmentTypeInput = "new" | "returning" | "transferee";

type UploadedDocumentInput = {
  documentType: EnrollmentDocumentType;
  url: string;
  filename: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
};

type EnrollmentPayload = {
  enrollmentType?: EnrollmentTypeInput;
  existingStudentId?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: "male" | "female";
  nationality?: string;
  religion?: string;
  lrn?: string;
  gradeLevel?: string;
  fatherName?: string;
  fatherOccupation?: string;
  fatherContact?: string;
  motherName?: string;
  motherOccupation?: string;
  motherContact?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  street?: string;
  barangay?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  previousSchoolName?: string;
  previousSchoolAddress?: string;
  previousSchoolLastGradeCompleted?: string;
  previousSchoolYear?: string;
};

function toEnrollmentType(value: unknown): EnrollmentTypeInput | null {
  return value === "new" || value === "returning" || value === "transferee"
    ? value
    : null;
}

function normalizeUploadedDocuments(value: unknown): UploadedDocumentInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is UploadedDocumentInput => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as UploadedDocumentInput).documentType === "string" &&
        ENROLLMENT_DOCUMENT_TYPES.includes(
          (item as UploadedDocumentInput).documentType
        ) &&
        typeof (item as UploadedDocumentInput).url === "string" &&
        typeof (item as UploadedDocumentInput).filename === "string"
      );
    })
    .map((item) => ({
      documentType: item.documentType,
      url: item.url,
      filename: item.filename,
      originalName: item.originalName,
      size: item.size,
      mimeType: item.mimeType,
    }));
}

function getMissingRequiredFields(payload: EnrollmentPayload): string[] {
  const required = [
    "firstName",
    "lastName",
    "birthDate",
    "birthPlace",
    "gender",
    "gradeLevel",
  ] as const;

  return required.filter((field) => {
    const value = payload[field];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const gradeLevel = searchParams.get("gradeLevel");
    const studentIdFilter = searchParams.get("studentId");
    const includeDrafts =
      searchParams.get("includeDrafts") === "1" ||
      searchParams.get("includeDrafts") === "true";
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);

    const query: Record<string, unknown> = {};

    if (session.user.role === "parent") {
      query.submittedBy = session.user.id;
      // SEC-003: parent isolation enforced
      if (!includeDrafts) {
        query.isDraft = false;
      }
    }

    if (status) query.status = status;
    if (gradeLevel) query.gradeLevel = gradeLevel;
    // Admin/registrar can filter by studentId
    if (studentIdFilter && session.user.role !== "parent") query.studentId = studentIdFilter;

    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate("studentId", "personalInfo studentId")
        .populate("schoolYearId", "name")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(query),
    ]);

    return NextResponse.json({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching enrollments", { route: "GET /api/enrollments", error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = sanitizeObject(await request.json() as Record<string, unknown>);
    const action = body?.action === "save_draft" ? "save_draft" : "submit";
    const formData: EnrollmentPayload =
      typeof body?.formData === "object" && body.formData !== null
        ? body.formData
        : body;
    const draftId = typeof body?.draftId === "string" ? body.draftId : undefined;

    if (action === "save_draft") {
      const draftSnapshot = {
        ...formData,
        uploadedDocuments: normalizeUploadedDocuments(body?.uploadedDocuments),
      };

      const draftEnrollmentType = toEnrollmentType(formData.enrollmentType);

      if (draftId) {
        const existingDraft = await Enrollment.findOne({
          _id: draftId,
          submittedBy: session.user.id,
          isDraft: true,
        });

        if (!existingDraft) {
          return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        }

        existingDraft.draftData = draftSnapshot;
        existingDraft.enrollmentType = draftEnrollmentType ?? undefined;
        existingDraft.gradeLevel = formData.gradeLevel || undefined;
        existingDraft.status = "draft";
        await existingDraft.save();

        return NextResponse.json({
          message: "Draft updated successfully",
          draft: {
            id: existingDraft._id,
            enrollmentNumber: existingDraft.enrollmentNumber,
            updatedAt: existingDraft.updatedAt,
          },
        });
      }

      const newDraft = await Enrollment.create({
        enrollmentNumber: `DRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        enrollmentType: draftEnrollmentType ?? undefined,
        gradeLevel: formData.gradeLevel || undefined,
        status: "draft",
        isDraft: true,
        draftData: draftSnapshot,
        statusHistory: [],
        documents: [],
        submittedBy: session.user.id,
      });

      return NextResponse.json(
        {
          message: "Draft saved successfully",
          draft: {
            id: newDraft._id,
            enrollmentNumber: newDraft.enrollmentNumber,
            updatedAt: newDraft.updatedAt,
          },
        },
        { status: 201 }
      );
    }

    const enrollmentType = toEnrollmentType(formData.enrollmentType);
    if (!enrollmentType) {
      return NextResponse.json(
        { error: "Enrollment type must be new, returning, or transferee" },
        { status: 400 }
      );
    }

    // CORE-007: Transferee-specific validation
    if (enrollmentType === "transferee") {
      if (!formData.previousSchoolName?.trim()) {
        return NextResponse.json(
          { error: "Previous school name is required for transferee enrollment." },
          { status: 400 }
        );
      }
      if (!formData.previousSchoolLastGradeCompleted?.trim()) {
        return NextResponse.json(
          { error: "Last grade completed at previous school is required." },
          { status: 400 }
        );
      }
    }

    const missingFields = getMissingRequiredFields(formData);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const uploadedDocuments = normalizeUploadedDocuments(body?.uploadedDocuments);
    const requiredDocumentTypes = getRequiredDocumentTypes(enrollmentType);
    const uploadedDocumentTypes = new Set(
      uploadedDocuments.map((document) => document.documentType)
    );
    const missingDocumentTypes = requiredDocumentTypes.filter(
      (type) => !uploadedDocumentTypes.has(type)
    );

    if (missingDocumentTypes.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required documents: ${missingDocumentTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Find or create active school year
    let activeSchoolYear = await SchoolYear.findOne({ isActive: true });
    if (!activeSchoolYear) {
      // Auto-create an active school year if none exists
      const currentYear = new Date().getFullYear();
      activeSchoolYear = await SchoolYear.create({
        name: `${currentYear}-${currentYear + 1}`,
        startDate: new Date(`${currentYear}-06-01`),
        endDate: new Date(`${currentYear + 1}-03-31`),
        enrollmentPeriod: {
          start: new Date(`${currentYear}-01-01`),
          end: new Date(`${currentYear + 1}-12-31`),
        },
        isActive: true,
        status: "enrollment",
      });
    }

    // ADM-007: Enforce enrollment period — only allow if status is "enrollment"
    if (activeSchoolYear.status && activeSchoolYear.status !== "enrollment") {
      return NextResponse.json({ error: "Enrollment is currently closed." }, { status: 400 });
    }

    let student =
      enrollmentType === "returning" && formData.existingStudentId
        ? await Student.findOne({
            _id: formData.existingStudentId,
            parentUserId: session.user.id,
          })
        : null;

    if (enrollmentType === "returning" && !student) {
      return NextResponse.json(
        { error: "Please select a valid existing child for returning enrollment." },
        { status: 400 }
      );
    }

    // Soft check: log if grade level doesn't match expected progression
    if (enrollmentType === "returning" && student && student.currentGradeLevel && formData.gradeLevel) {
      const gradeOrder = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
      const currentIdx = gradeOrder.indexOf(student.currentGradeLevel);
      const newIdx = gradeOrder.indexOf(formData.gradeLevel);
      if (currentIdx !== -1 && newIdx !== -1 && newIdx !== currentIdx + 1) {
        console.warn(`[CORE-007] Grade progression warning: student ${student.studentId} moving from ${student.currentGradeLevel} to ${formData.gradeLevel}`);
      }
    }

    if (!student) {
      const studentCount = await Student.countDocuments();
      const studentGeneratedId = generateId("STU", studentCount + 1);

      if (formData.lrn) {
        const existingLRN = await Student.findOne({ lrn: formData.lrn });
        if (existingLRN) {
          return NextResponse.json(
            { error: `LRN ${formData.lrn} is already registered to another student. If this is your child, please use "Returning" enrollment type.` },
            { status: 409 }
          );
        }
      }

      student = await Student.create({
        studentId: studentGeneratedId,
        lrn: formData.lrn || undefined,
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || undefined,
          suffix: formData.suffix || undefined,
          birthDate: new Date(formData.birthDate as string),
          birthPlace: formData.birthPlace,
          gender: formData.gender,
          nationality: formData.nationality || "Filipino",
          religion: formData.religion || undefined,
        },
        contactInfo: {
          address: {
            street: formData.street || formData.city || "N/A",
            barangay: formData.barangay || "N/A",
            city: formData.city || "N/A",
            province: formData.province || "N/A",
            zipCode: formData.zipCode || "0000",
          },
        },
        guardianInfo: {
          father: formData.fatherName
            ? {
                fullName: formData.fatherName,
                occupation: formData.fatherOccupation || undefined,
                contactNumber: formData.fatherContact || undefined,
              }
            : undefined,
          mother: formData.motherName
            ? {
                fullName: formData.motherName,
                occupation: formData.motherOccupation || undefined,
                contactNumber: formData.motherContact || undefined,
              }
            : undefined,
          guardian: formData.guardianName
            ? {
                fullName: formData.guardianName,
                relationship: formData.guardianRelationship || "Guardian",
                contactNumber: formData.guardianContact || "",
              }
            : undefined,
        },
        parentUserId: session.user.id,
        status: "active",
      });
    } else {
      student.lrn = formData.lrn || undefined;
      student.personalInfo.firstName = formData.firstName || student.personalInfo.firstName;
      student.personalInfo.lastName = formData.lastName || student.personalInfo.lastName;
      student.personalInfo.middleName = formData.middleName || undefined;
      student.personalInfo.suffix = formData.suffix || undefined;
      student.personalInfo.birthDate = new Date(formData.birthDate as string);
      student.personalInfo.birthPlace = formData.birthPlace || student.personalInfo.birthPlace;
      student.personalInfo.gender = formData.gender || student.personalInfo.gender;
      student.personalInfo.nationality = formData.nationality || "Filipino";
      student.personalInfo.religion = formData.religion || undefined;
      student.contactInfo.address = {
        street: formData.street || student.contactInfo.address.street,
        barangay: formData.barangay || student.contactInfo.address.barangay,
        city: formData.city || student.contactInfo.address.city,
        province: formData.province || student.contactInfo.address.province,
        zipCode: formData.zipCode || student.contactInfo.address.zipCode,
      };
      student.guardianInfo = {
        father: formData.fatherName
          ? {
              fullName: formData.fatherName,
              occupation: formData.fatherOccupation || undefined,
              contactNumber: formData.fatherContact || undefined,
            }
          : undefined,
        mother: formData.motherName
          ? {
              fullName: formData.motherName,
              occupation: formData.motherOccupation || undefined,
              contactNumber: formData.motherContact || undefined,
            }
          : undefined,
        guardian: formData.guardianName
          ? {
              fullName: formData.guardianName,
              relationship: formData.guardianRelationship || "Guardian",
              contactNumber: formData.guardianContact || "",
            }
          : undefined,
      };
      await student.save();
    }

    const enrollmentCount = await Enrollment.countDocuments({ isDraft: false });
    const generatedEnrollmentNumber = generateId("ENR", enrollmentCount + 1);
    const draft = draftId
      ? await Enrollment.findOne({
          _id: draftId,
          submittedBy: session.user.id,
          isDraft: true,
        })
      : null;

    const enrollment =
      draft ||
      new Enrollment({
        enrollmentNumber: generatedEnrollmentNumber,
        submittedBy: session.user.id,
      });

    if (!draft || enrollment.enrollmentNumber.startsWith("DRF-")) {
      enrollment.enrollmentNumber = generatedEnrollmentNumber;
    }

    enrollment.studentId = student._id;
    enrollment.schoolYearId = activeSchoolYear._id;
    enrollment.enrollmentType = enrollmentType;
    enrollment.gradeLevel = formData.gradeLevel;
    enrollment.previousSchool =
      enrollmentType === "transferee"
        ? {
            name: formData.previousSchoolName || "",
            address: formData.previousSchoolAddress || "",
            lastGradeCompleted: formData.previousSchoolLastGradeCompleted || "",
            schoolYear: formData.previousSchoolYear || "",
          }
        : undefined;
    enrollment.status = "pending";
    enrollment.isDraft = false;
    enrollment.draftData = undefined;
    enrollment.submittedAt = new Date();
    enrollment.statusHistory = [
      {
        status: "pending",
        changedBy: new Types.ObjectId(session.user.id),
        changedAt: new Date(),
        remarks: "Application submitted",
      },
    ];
    enrollment.documents = [];
    await enrollment.save();

    await Document.deleteMany({
      enrollmentId: enrollment._id,
      uploadedBy: session.user.id,
    });

    const createdDocuments = await Promise.all(
      uploadedDocuments.map((document) =>
        Document.create({
          studentId: student?._id,
          enrollmentId: enrollment._id,
          type: document.documentType,
          fileName: document.filename,
          originalName: document.originalName || document.filename,
          fileSize: document.size || 0,
          mimeType: document.mimeType || "application/octet-stream",
          cloudinaryId: document.filename,
          cloudinaryUrl: document.url,
          secureUrl: document.url,
          uploadedBy: session.user.id,
        })
      )
    );

    enrollment.documents = createdDocuments.map((document) => ({
      type: document.type,
      documentId: document._id,
      status: "pending",
    }));
    await enrollment.save();

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    void createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "ENROLLMENT",
      resourceId: enrollment._id.toString(),
      ipAddress,
      userAgent,
    });

    await Student.findByIdAndUpdate(student._id, {
      $addToSet: { enrollmentHistory: enrollment._id },
      currentGradeLevel: formData.gradeLevel,
    });

    // Fire-and-forget: send email + in-app notification
    const studentName = `${formData.firstName ?? ""} ${formData.lastName ?? ""}`.trim();
    void Promise.resolve().then(async () => {
      const parent = await User.findById(session.user.id).select("email profile").lean();
      if (parent) {
        const parentName = `${parent.profile?.firstName ?? ""} ${parent.profile?.lastName ?? ""}`.trim() || parent.email;
        await sendEnrollmentSubmittedEmail({
          email: parent.email,
          name: parentName,
          enrollmentNumber: enrollment.enrollmentNumber,
          studentName,
          gradeLevel: formData.gradeLevel ?? "",
          enrollmentType,
        });
      }
      await createNotification({
        userId: session.user.id,
        title: "Enrollment Submitted",
        message: `Your enrollment for ${studentName} (${enrollment.enrollmentNumber}) has been submitted and is under review.`,
        type: "success",
        link: `/parent/enrollment/${enrollment._id}`,
      });
    }).catch(console.error);

    return NextResponse.json(
      {
        message: "Enrollment submitted successfully",
        enrollment: {
          id: enrollment._id,
          enrollmentNumber: enrollment.enrollmentNumber,
          status: enrollment.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error creating enrollment", { route: "POST /api/enrollments", error: String(error) });
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}
