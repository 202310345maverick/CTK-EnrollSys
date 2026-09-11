import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import Student from "@/models/Student";
import { generateId, formatCurrency } from "@/lib/utils";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { sendPaymentConfirmationEmail } from "@/lib/auth/email";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { createAuditLog } from "@/lib/audit";
import { sanitizeObject } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import fs from "fs";
import path from "path";

const CTK_LOGO_PATH = path.join(process.cwd(), "public", "images", "ctk.png");

function getCtkLogoDataUrl() {
  try {
    const fileBuffer = fs.readFileSync(CTK_LOGO_PATH);
    return `data:image/png;base64,${fileBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function buildOfficialReceiptPdf(doc: jsPDF, params: {
  schoolName: string;
  receiptNumber: string;
  receiptDate: string;
  payerName: string;
  description: string;
  amount: number;
  currency?: string;
}) {
  const logo = getCtkLogoDataUrl();
  const currencyPrefix = "₱";
  const formatPhpAmount = (value: number) => `${currencyPrefix}${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const amountText = formatPhpAmount(params.amount);
  const payerName = params.payerName || "Student Name";
  const descriptionText = params.description || "Tuition";

  doc.setFillColor(245, 247, 249);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(15, 23, 42);

  doc.setDrawColor(184, 199, 214);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 12, 182, 263, 6, 6, "S");

  if (logo) {
    doc.addImage(logo, "PNG", 26, 18, 24, 24);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text((params.schoolName || "Christ the King Catholic School").trim(), 58, 30);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.text("Official Receipt", 58, 39);

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("RECEIPT", 190, 35, { align: "right" });

  doc.setFillColor(221, 232, 240);
  doc.roundedRect(24, 52, 162, 30, 4, 4, "F");
  doc.setTextColor(15, 23, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("To", 30, 64);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(payerName, 30, 80);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Receipt #", 129, 64);
  doc.text(params.receiptNumber || "0001001", 190, 64, { align: "right" });
  doc.text("Receipt Date", 129, 74);
  doc.text(params.receiptDate, 190, 74, { align: "right" });

  doc.setFillColor(15, 23, 42);
  doc.rect(24, 96, 162, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("QTY", 30, 103);
  doc.text("Description", 70, 103);
  doc.text("Unit Price", 138, 103, { align: "right" });
  doc.text("Amount", 190, 103, { align: "right" });

  doc.setFillColor(255, 255, 255);
  doc.rect(24, 106, 162, 20, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1", 30, 119);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(descriptionText, 70, 119);
  doc.text(amountText, 138, 119, { align: "right" });
  doc.text(amountText, 190, 119, { align: "right" });

  doc.setFillColor(236, 240, 245);
  doc.roundedRect(24, 144, 162, 26, 4, 4, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Total", 104, 161, { align: "center" });
  doc.setFontSize(20);
  doc.text(amountText, 190, 161, { align: "right" });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text("Thank you for your payment.", 24, 260);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const enrollmentId = searchParams.get("enrollmentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const includeVoided = searchParams.get("includeVoided") === "true";
    const query: Record<string, unknown> = includeVoided ? {} : { isVoided: false };

    if (session.user.role === "parent") {
      const students = await Student.find({ parentUserId: session.user.id })
        .select("_id")
        .lean();
      const parentStudentIds = students.map((student) => student._id.toString());

      if (parentStudentIds.length === 0) {
        return NextResponse.json({
          payments: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      if (studentId && !parentStudentIds.includes(studentId)) {
        return NextResponse.json({
          payments: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      query.studentId = studentId ? studentId : { $in: parentStudentIds };
      // SEC-003: parent isolation enforced
    }

    if (studentId && session.user.role !== "parent") query.studentId = studentId;
    if (enrollmentId) query.enrollmentId = enrollmentId;

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("studentId", "personalInfo studentId")
        .populate("receivedBy", "profile.firstName profile.lastName")
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching payments", { route: "GET /api/payments", error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "registrar"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = sanitizeObject(await request.json() as Record<string, unknown>);

    // Strip empty strings for ObjectId fields to avoid CastError
    const cleanBody: Record<string, unknown> = { ...body };
    for (const key of ["enrollmentId", "studentId", "schoolYearId"]) {
      if (cleanBody[key] === "" || cleanBody[key] == null) delete cleanBody[key];
    }

    // Generate receipt number
    const paymentCount = await Payment.countDocuments();
    const receiptNumber = generateId("OR", paymentCount + 1);

    const payment = await Payment.create({
      ...cleanBody,
      receiptNumber,
      receivedBy: session.user.id,
      isVoided: false,
    });

    // Fire-and-forget: send payment confirmation
    void Promise.resolve().then(async () => {
      let parentId: string | null = null;
      let studentName = "";

      if (cleanBody.enrollmentId) {
        const enrollment = await Enrollment.findById(cleanBody.enrollmentId)
          .populate("studentId", "personalInfo")
          .lean();
        if (enrollment) {
          parentId = enrollment.submittedBy?.toString() ?? null;
          const si = (enrollment.studentId as any)?.personalInfo;
          if (si) studentName = `${si.firstName ?? ""} ${si.lastName ?? ""}`.trim();
        }
      }

      if (!parentId && cleanBody.studentId) {
        const student = await Student.findById(cleanBody.studentId).select("parentUserId personalInfo").lean();
        if (student) {
          parentId = student.parentUserId?.toString() ?? null;
          const si = (student as any).personalInfo;
          if (si) studentName = `${si.firstName ?? ""} ${si.lastName ?? ""}`.trim();
        }
      }

      if (parentId) {
        const parent = await User.findById(parentId).select("email profile").lean();
        if (parent) {
          const parentName = `${parent.profile?.firstName ?? ""} ${parent.profile?.lastName ?? ""}`.trim() || parent.email;
          const paymentDateStr = payment.paymentDate
            ? new Date(payment.paymentDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
            : new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
          try {
            const doc = new jsPDF({ unit: "mm", format: "a4" });
            buildOfficialReceiptPdf(doc, {
              schoolName: "Christ the King Catholic School",
              receiptNumber: payment.receiptNumber,
              receiptDate: paymentDateStr,
              payerName: studentName || "Student Name",
              description: payment.description || payment.paymentType || "Payment",
              amount: payment.amount ?? 0,
              currency: "PHP",
            });
            const ab = doc.output("arraybuffer");
            const pdfBuffer = Buffer.from(ab);
            await sendPaymentConfirmationEmail({
              email: parent.email,
              name: parentName,
              receiptNumber: payment.receiptNumber,
              studentName,
              amount: payment.amount,
              paymentDate: paymentDateStr,
              attachments: [{ filename: `e-invoice-${payment.receiptNumber}.pdf`, content: pdfBuffer }],
            });
          } catch (err) {
            console.error("Failed to generate/send e-invoice:", err);
            await sendPaymentConfirmationEmail({
              email: parent.email,
              name: parentName,
              receiptNumber: payment.receiptNumber,
              studentName,
              amount: payment.amount,
              paymentDate: paymentDateStr,
            });
          }
          await createNotification({
            userId: parentId,
            title: "Payment Recorded",
            message: `Payment of ₱${payment.amount?.toLocaleString("en-PH") ?? 0} has been recorded for ${studentName || "your child"} (Receipt: ${payment.receiptNumber}).`,
            type: "success",
          });
        }
      }
    }).catch(console.error);

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    void createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "PAYMENT",
      resourceId: payment._id.toString(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        message: "Payment recorded successfully",
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error recording payment", { route: "POST /api/payments", error: String(error) });
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
