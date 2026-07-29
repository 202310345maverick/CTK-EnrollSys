import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import { createAuditLog } from "@/lib/audit";
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

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Christ the King Catholic School", 20, 20);
    doc.setFontSize(12);
    doc.text(`Receipt: ${payment.receiptNumber}`, 20, 40);
    doc.text(`Student: ${studentName}`, 20, 55);
    doc.text(`Amount: ${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(payment.amount)}`, 20, 70);
    doc.text(`Payment Date: ${paymentDateStr}`, 20, 85);

    try {
      // @ts-ignore
      if ((doc as any).autoTable) {
        // @ts-ignore
        (doc as any).autoTable({
          startY: 100,
          head: [["Description", "Amount"]],
          body: [[payment.description || "Payment", new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(payment.amount)]],
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
