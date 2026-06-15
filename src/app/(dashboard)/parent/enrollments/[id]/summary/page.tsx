import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Enrollment from "@/models/Enrollment";

export default async function EnrollmentSummaryPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  await dbConnect();

  const enrollment = await Enrollment.findOne({ _id: params.id, submittedBy: userId, isDraft: false })
    .populate("studentId", "personalInfo")
    .lean();

  if (!enrollment) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-lg font-semibold">Enrollment Summary</h1>
        <p className="text-sm text-muted-foreground">Enrollment not found or you do not have access.</p>
        <div className="mt-4">
          <Link href="/parent/enrollments">
            <a className="text-sm text-blue-600 underline">Back to enrollments</a>
          </Link>
        </div>
      </div>
    );
  }

  const student = enrollment.studentId as any;
  const personal = student?.personalInfo ?? {};

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Enrollment Summary</h1>
        <div className="text-sm">
          <a href={`/api/enrollments/${params.id}/report`} className="inline-block rounded border px-3 py-1 text-sm">
            Download PDF
          </a>
        </div>
      </div>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">Application</h2>
        <table className="w-full text-sm mt-2">
          <tbody>
            <tr><td className="text-muted-foreground">Enrollment Number</td><td>{enrollment.enrollmentNumber || "—"}</td></tr>
            <tr><td className="text-muted-foreground">Grade Level</td><td>{enrollment.gradeLevel || "—"}</td></tr>
            <tr><td className="text-muted-foreground">Status</td><td>{String(enrollment.status).replace("_", " ")}</td></tr>
            <tr><td className="text-muted-foreground">Submitted</td><td>{new Date(enrollment.submittedAt || enrollment.createdAt || Date.now()).toLocaleString("en-PH")}</td></tr>
            <tr><td className="text-muted-foreground">Remarks</td><td>{(enrollment as any).remarks ?? (enrollment as any).remark ?? "—"}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">Student</h2>
        <table className="w-full text-sm mt-2">
          <tbody>
            <tr><td className="text-muted-foreground">Name</td><td>{personal.firstName} {personal.lastName}</td></tr>
            <tr><td className="text-muted-foreground">Birth Date</td><td>{personal.birthDate || "—"}</td></tr>
            <tr><td className="text-muted-foreground">Gender</td><td>{personal.gender || "—"}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">Uploaded Documents</h2>
        <table className="w-full text-sm mt-2 border-t">
          <thead>
            <tr className="text-xs text-muted-foreground"><th className="text-left py-2">Document</th><th className="text-left py-2">Filename</th><th className="text-left py-2">Size</th></tr>
          </thead>
          <tbody>
            {(enrollment.documents || []).map((d: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="py-2">{String(d.type)}</td>
                <td className="py-2">{(d.documentId as any)?.originalName ?? (d.documentId as any)?.fileName ?? "—"}</td>
                <td className="py-2">{(d.documentId as any)?.size ? `${Math.round(((d.documentId as any).size || 0) / 1024)} KB` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">Use the &quot;Download PDF&quot; button to get a printable enrollment summary.</p>
    </div>
  );
}
