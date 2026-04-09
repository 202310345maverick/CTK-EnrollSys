import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import SchoolYear from "@/models/SchoolYear";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const schoolYears = await SchoolYear.find()
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json({ schoolYears });
  } catch (error) {
    console.error("Error fetching school years:", error);
    return NextResponse.json(
      { error: "Failed to fetch school years" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // If setting this as active, deactivate others
    if (body.isActive) {
      await SchoolYear.updateMany({}, { isActive: false });
    }

    const schoolYear = await SchoolYear.create({
      ...body,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        message: "School year created successfully",
        schoolYear,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating school year:", error);
    return NextResponse.json(
      { error: "Failed to create school year" },
      { status: 500 }
    );
  }
}
