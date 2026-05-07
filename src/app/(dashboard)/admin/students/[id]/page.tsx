import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db/connection";
import Student from "@/models/Student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, User, Calendar, Phone, MapPin, FileText,
  GraduationCap, Heart, History, UserCheck,
} from "lucide-react";
import Link from "next/link";

async function getStudent(studentId: string) {
  await dbConnect();
  return Student.findById(studentId).lean();
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-slate-100 text-slate-600",
  graduated: "bg-blue-100 text-blue-800",
  transferred: "bg-amber-100 text-amber-800",
};

function formatDate(date: unknown) {
  if (!date) return "—";
  return new Date(date as Date).toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="mt-0.5 font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

export default async function RegistrarStudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "registrar"].includes(session.user.role)) {
    redirect("/login");
  }

  const student = await getStudent(params.id);

  if (!student) {
    return (
      <div className="space-y-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student Records
          </Button>
        </Link>
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            Student not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = student as any;
  const address = s.contactInfo?.address;
  const statusStyle = STATUS_STYLES[s.status] || "bg-slate-100 text-slate-600";

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/students">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Student Records
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {s.personalInfo?.firstName} {s.personalInfo?.middleName ? `${s.personalInfo.middleName} ` : ""}
            {s.personalInfo?.lastName}
            {s.personalInfo?.suffix ? `, ${s.personalInfo.suffix}` : ""}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Student ID: <span className="font-mono font-medium text-slate-700">{s.studentId || "—"}</span>
            {s.lrn && <> &bull; LRN: <span className="font-mono font-medium text-slate-700">{s.lrn}</span></>}
          </p>
        </div>
        <span className={`self-start sm:self-auto inline-flex px-3 py-1 rounded-full text-sm font-semibold capitalize ${statusStyle}`}>
          {s.status || "unknown"}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Personal Information */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-[#b4040d]" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Full Name"
              value={[s.personalInfo?.firstName, s.personalInfo?.middleName, s.personalInfo?.lastName, s.personalInfo?.suffix].filter(Boolean).join(" ")} />
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Gender" value={s.personalInfo?.gender} />
              <InfoRow label="Nationality" value={s.personalInfo?.nationality} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Date of Birth" value={formatDate(s.personalInfo?.birthDate)} />
              <InfoRow label="Birth Place" value={s.personalInfo?.birthPlace} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Religion" value={s.personalInfo?.religion} />
              <InfoRow label="Mother Tongue" value={s.personalInfo?.motherTongue} />
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-[#b4040d]" /> Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Student ID" value={s.studentId} />
              <InfoRow label="LRN" value={s.lrn} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Grade Level" value={s.currentGradeLevel} />
              <InfoRow label="Section" value={s.section} />
            </div>
            <InfoRow label="Status" value={s.status} />
          </CardContent>
        </Card>

        {/* Contact & Address */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-[#b4040d]" /> Contact & Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Contact Number" value={s.contactInfo?.contactNumber} />
            <InfoRow label="Email" value={s.contactInfo?.email} />
            {address && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Address</p>
                <p className="mt-0.5 font-medium text-slate-900 leading-relaxed">
                  {[address.street, address.barangay, address.city, address.province, address.zipCode]
                    .filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guardian / Parents */}
        <Card className="md:col-span-2 xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-[#b4040d]" /> Guardian / Parents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {s.guardianInfo?.father?.fullName && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Father</p>
                  <InfoRow label="Name" value={s.guardianInfo.father.fullName} />
                  <InfoRow label="Occupation" value={s.guardianInfo.father.occupation} />
                  <InfoRow label="Contact" value={s.guardianInfo.father.contactNumber} />
                </div>
              )}
              {s.guardianInfo?.mother?.fullName && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mother</p>
                  <InfoRow label="Name" value={s.guardianInfo.mother.fullName} />
                  <InfoRow label="Occupation" value={s.guardianInfo.mother.occupation} />
                  <InfoRow label="Contact" value={s.guardianInfo.mother.contactNumber} />
                </div>
              )}
              {s.guardianInfo?.guardian?.fullName && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Guardian ({s.guardianInfo.guardian.relationship})
                  </p>
                  <InfoRow label="Name" value={s.guardianInfo.guardian.fullName} />
                  <InfoRow label="Occupation" value={s.guardianInfo.guardian.occupation} />
                  <InfoRow label="Contact" value={s.guardianInfo.guardian.contactNumber} />
                </div>
              )}
              {!s.guardianInfo?.father?.fullName && !s.guardianInfo?.mother?.fullName && !s.guardianInfo?.guardian?.fullName && (
                <p className="text-sm text-slate-500 col-span-3">No guardian information on file.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        {s.medicalInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-[#b4040d]" /> Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Blood Type" value={s.medicalInfo?.bloodType} />
              {s.medicalInfo?.allergies?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Allergies</p>
                  <p className="mt-0.5 text-slate-900">{s.medicalInfo.allergies.join(", ")}</p>
                </div>
              )}
              {s.medicalInfo?.conditions?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Conditions</p>
                  <p className="mt-0.5 text-slate-900">{s.medicalInfo.conditions.join(", ")}</p>
                </div>
              )}
              {s.medicalInfo?.emergencyContact && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Emergency Contact</p>
                  <p className="mt-0.5 font-medium text-slate-900">{s.medicalInfo.emergencyContact.name}</p>
                  <p className="text-sm text-slate-600">{s.medicalInfo.emergencyContact.relationship} &bull; {s.medicalInfo.emergencyContact.contactNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        {s.statusHistory?.length > 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-[#b4040d]" /> Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...s.statusHistory].reverse().map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className={`mt-0.5 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[h.status] || "bg-slate-100 text-slate-600"}`}>
                      {h.status}
                    </span>
                    <div>
                      <p className="text-sm text-slate-700">{h.reason || "Status updated"}</p>
                      <p className="text-xs text-slate-400">{formatDate(h.changedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
