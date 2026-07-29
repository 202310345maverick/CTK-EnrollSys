export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Notification from "@/models/Notification";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const notification = await Notification.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
