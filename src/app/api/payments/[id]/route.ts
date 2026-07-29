import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import { createAuditLog } from "@/lib/audit";
import { formatCurrency } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Christ the King Catholic School", 20, 24);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#4b5563");
    doc.text("Official Payment Receipt", 20, 32);
    doc.setTextColor("#111827");
    doc.setFontSize(12);
    doc.text(`Receipt: ${payment.receiptNumber}`, 20, 44);
    doc.text(`Date: ${paymentDateStr}`, 190, 44, { align: "right" });
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(20, 48, 190, 48);

    const metaStartY = 56;
    const labelX = 20;
    const valueX = 100;
    doc.setFontSize(11);
    doc.text("Student:", labelX, metaStartY);
    doc.text(studentName || "—", valueX, metaStartY);
    doc.text("Payment Type:", labelX, metaStartY + 8);
    doc.text(payment.paymentType || "Payment", valueX, metaStartY + 8);
    doc.text("Amount:", labelX, metaStartY + 16);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(payment.amount), valueX, metaStartY + 16);
    doc.setFont("helvetica", "normal");
    doc.text("Payment Date:", labelX, metaStartY + 24);
    doc.text(paymentDateStr, valueX, metaStartY + 24);
    doc.setFontSize(10);
    doc.setTextColor("#6b7280");
    doc.text("Please keep this receipt for your records.", 20, metaStartY + 36);

    try {
      // @ts-ignore
      if ((doc as any).autoTable) {
        // @ts-ignore
        (doc as any).autoTable({
          startY: metaStartY + 46,
          head: [["Description", "Amount"]],
          body: [[payment.description || payment.paymentType || "Payment", formatCurrency(payment.amount)]],
          theme: "grid",
          headStyles: { fillColor: [241, 245, 249], textColor: [17, 24, 39], halign: "left" },
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: { 0: { cellWidth: 130 }, 1: { halign: "right", cellWidth: 40 } },
        });
      }
    } catch (e) {
      // ignore autoTable errors
    }

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
