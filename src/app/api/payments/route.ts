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
import { buildPaymentReceiptPdf } from "@/lib/payment-receipt";
import { createAuditLog } from "@/lib/audit";
import { sanitizeObject } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

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
            const pdfBuffer = buildPaymentReceiptPdf({
              receiptNumber: payment.receiptNumber,
              studentName,
              paymentDate: paymentDateStr,
              paymentType: payment.paymentType,
              description: payment.description,
              paymentMethod: payment.paymentMethod,
              remarks: payment.remarks,
              receivedBy: session.user.name || session.user.email || "Registrar",
              amount: payment.amount,
            });

            await sendPaymentConfirmationEmail({
              email: parent.email,
              name: parentName,
              receiptNumber: payment.receiptNumber,
              studentName,
              amount: payment.amount,
              paymentDate: paymentDateStr,
              paymentType: payment.paymentType,
              description: payment.description,
              paymentMethod: payment.paymentMethod,
              remarks: payment.remarks,
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
              paymentType: payment.paymentType,
              description: payment.description,
              paymentMethod: payment.paymentMethod,
              remarks: payment.remarks,
            });
          }
          await createNotification({
            userId: parentId,
            title: "Payment Recorded",
            message: `Payment of ${formatCurrency(payment.amount)} has been recorded for ${studentName || "your child"} (Receipt: ${payment.receiptNumber}).`,
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
