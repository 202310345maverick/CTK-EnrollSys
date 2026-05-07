import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import SystemSettings from "@/models/SystemSettings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    let settings = await SystemSettings.findOne().lean();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const {
      schoolName,
      schoolShortName,
      schoolAddress,
      schoolEmail,
      schoolPhone,
      maxStudentsPerSection,
      allowParentSelfRegistration,
      requireDocumentUploadOnSubmit,
    } = body;

    const settings = await SystemSettings.findOneAndUpdate(
      {},
      {
        $set: {
          schoolName,
          schoolShortName,
          schoolAddress,
          schoolEmail,
          schoolPhone,
          maxStudentsPerSection,
          allowParentSelfRegistration,
          requireDocumentUploadOnSubmit,
          updatedBy: session.user.id,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Settings saved", settings });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
