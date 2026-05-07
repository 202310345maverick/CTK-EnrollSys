import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";

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

    return NextResponse.json({ message: "Payment voided successfully", payment });
  } catch (error) {
    console.error("Error voiding payment:", error);
    return NextResponse.json({ error: "Failed to void payment" }, { status: 500 });
  }
}
