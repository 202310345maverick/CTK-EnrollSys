import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const enrollment = await Enrollment.findById(params.id)
      .populate("studentId", "personalInfo")
      .lean();

    if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Authorization: parents may only fetch their own enrollments
    if (session.user.role === "parent" && String(enrollment.submittedBy) !== String(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const student = (enrollment.studentId as any)?.personalInfo ?? {};

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Christ the King Catholic School", 20, 20);
    doc.setFontSize(12);
    doc.text(`Enrollment Summary: ${enrollment.enrollmentNumber ?? params.id}`, 20, 36);
    doc.text(`Student: ${student.firstName ?? ""} ${student.lastName ?? ""}`.trim(), 20, 48);
    doc.text(`Grade Level: ${enrollment.gradeLevel || "—"}`, 20, 60);
    doc.text(`Status: ${String(enrollment.status).replace("_", " ")}`, 20, 72);

    const docRows = (enrollment.documents || []).map((d: any) => [String(d.type), d.documentId?.originalName || d.documentId?.fileName || "—"]);
    try {
      // @ts-ignore
      if ((doc as any).autoTable) {
        // @ts-ignore
        (doc as any).autoTable({ startY: 90, head: [["Document", "Filename"]], body: docRows });
      }
    } catch (e) {
      // ignore
    }

    const ab = doc.output("arraybuffer");
    const pdfBuffer = Buffer.from(ab);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="enrollment-summary-${enrollment.enrollmentNumber ?? params.id}.pdf"`,
      },
    });
  } catch (error) {
    logger.error("Error generating enrollment report", { route: "GET /api/enrollments/:id/report", error: String(error) });
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
