import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";

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

    const enrollment = await Enrollment.findById(params.id).lean();
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Parents can only view their own enrollments
    if (
      session.user.role === "parent" &&
      enrollment.submittedBy?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assessed = (enrollment as any).assessedFees?.totalAmount ?? 0;

    const paidAgg = await Payment.aggregate([
      { $match: { enrollmentId: enrollment._id, isVoided: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const paid = paidAgg[0]?.total ?? 0;

    return NextResponse.json({ assessed, paid, balance: assessed - paid });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
