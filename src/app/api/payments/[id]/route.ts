import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import { createAuditLog } from "@/lib/audit";
import { formatCurrency } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
  const amountText = `₱${params.amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(15, 23, 42);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 12, 182, 263, 6, 6, "S");

  if (logo) {
    doc.addImage(logo, "PNG", 24, 20, 22, 22);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(params.schoolName || "Christ the King Catholic School", 52, 28);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("Official Receipt", 52, 35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(51, 65, 85);
  doc.text("RECEIPT", 190, 30, { align: "right" });

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(24, 48, 162, 26, 4, 4, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("To", 30, 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(params.payerName || "Customer Name", 30, 69);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Receipt #", 130, 58);
  doc.text(params.receiptNumber || "0001001", 190, 58, { align: "right" });
  doc.text("Receipt Date", 130, 68);
  doc.text(params.receiptDate, 190, 68, { align: "right" });

  doc.setFillColor(15, 23, 42);
  doc.rect(24, 92, 162, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("QTY", 30, 99);
  doc.text("Description", 70, 99);
  doc.text("Unit Price", 138, 99, { align: "right" });
  doc.text("Amount", 190, 99, { align: "right" });

  doc.setFillColor(255, 255, 255);
  doc.rect(24, 102, 162, 18, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("1", 30, 114);
  doc.setFont("helvetica", "normal");
  doc.text(params.description || "Payment", 70, 114);
  doc.text(new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(params.amount), 138, 114, { align: "right" });
  doc.text(amountText, 190, 114, { align: "right" });

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(24, 136, 162, 22, 4, 4, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", 118, 149, { align: "center" });
  doc.setFontSize(18);
  doc.text(amountText, 190, 149, { align: "right" });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text("Thank you for your payment.", 24, 260);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const payment = await Payment.findById(params.id)
      .populate("studentId", "personalInfo studentId parentUserId")
      .lean();
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const isAdminOrRegistrar = session.user.role === "admin" || session.user.role === "registrar";
    if (!isAdminOrRegistrar) {
      if (session.user.role === "parent") {
        const parentId = (payment as any).studentId?.parentUserId?.toString?.();
        if (!parentId || parentId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const studentPersonalInfo = (payment as any).studentId?.personalInfo || {};
    const studentName = `${studentPersonalInfo.firstName || ""} ${studentPersonalInfo.lastName || ""}`.trim();
    const paymentDateStr = payment.paymentDate
      ? new Date(payment.paymentDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

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

    const arrayBuffer = doc.output("arraybuffer");
    const pdfBuffer = Buffer.from(arrayBuffer);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="e-invoice-${payment.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating payment invoice:", error);
    return NextResponse.json({ error: "Failed to generate e-invoice" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "registrar"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const payment = await Payment.findById(params.id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.isVoided) {
      return NextResponse.json({ error: "Payment is already voided" }, { status: 400 });
    }

    const body = await request.json();
    const { voidReason } = body;

    if (!voidReason || !voidReason.trim()) {
      return NextResponse.json({ error: "Void reason is required" }, { status: 400 });
    }

    payment.isVoided = true;
    payment.voidedBy = session.user.id as any;
    payment.voidedAt = new Date();
    payment.voidReason = voidReason.trim();
    await payment.save();

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    void createAuditLog({
      userId: session.user.id,
      action: "VOID",
      resource: "PAYMENT",
      resourceId: params.id,
      details: { voidReason },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ message: "Payment voided successfully", payment });
  } catch (error) {
    console.error("Error voiding payment:", error);
    return NextResponse.json({ error: "Failed to void payment" }, { status: 500 });
  }
}
