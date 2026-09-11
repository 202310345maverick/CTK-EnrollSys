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
  const formatPhpAmount = (amount: number) => `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const amountText = formatPhpAmount(params.amount);
  const payerName = params.payerName || "Student Name";
  const descriptionText = params.description || "Tuition";
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const payerLines = doc.splitTextToSize(payerName, 90);
  const descLines = doc.splitTextToSize(descriptionText, 90);

  doc.setFillColor(245, 247, 249);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setTextColor(15, 23, 42);

  doc.setDrawColor(184, 199, 214);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, 12, pageWidth - margin * 2, pageHeight - 24, 6, 6, "S");

  if (logo) {
    doc.addImage(logo, "PNG", margin + 12, 18, 24, 24);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text((params.schoolName || "Christ the King Catholic School").trim(), margin + 38, 30);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.text("Official Receipt", margin + 38, 38);

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("RECEIPT", pageWidth - margin, 34, { align: "right" });

  doc.setFillColor(221, 232, 240);
  doc.roundedRect(margin + 10, 52, contentWidth - 20, 32, 4, 4, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("To", margin + 20, 64);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(payerLines, margin + 20, 76);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Receipt #", pageWidth - 96, 64);
  doc.text(params.receiptNumber || "0001001", pageWidth - margin, 64, { align: "right" });
  doc.text("Receipt Date", pageWidth - 96, 74);
  doc.text(params.receiptDate, pageWidth - margin, 74, { align: "right" });

  doc.setFillColor(15, 23, 42);
  doc.rect(margin + 10, 96, contentWidth - 20, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("QTY", margin + 18, 103);
  doc.text("Description", margin + 60, 103);
  doc.text("Unit Price", pageWidth - 82, 103, { align: "right" });
  doc.text("Amount", pageWidth - margin, 103, { align: "right" });

  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 10, 106, contentWidth - 20, 24, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1", margin + 18, 118);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(descLines, margin + 60, 118);
  doc.text(amountText, pageWidth - 82, 118, { align: "right" });
  doc.text(amountText, pageWidth - margin, 118, { align: "right" });

  doc.setFillColor(236, 240, 245);
  doc.roundedRect(margin + 10, 145, contentWidth - 20, 26, 4, 4, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Total", pageWidth / 2, 161, { align: "center" });
  doc.setFontSize(18);
  doc.text(amountText, pageWidth - margin, 161, { align: "right" });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text("Thank you for your payment.", margin + 12, pageHeight - 18);
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

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
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
