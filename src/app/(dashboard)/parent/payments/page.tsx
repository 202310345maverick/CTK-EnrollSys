import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Receipt, Wallet, AlertCircle, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StudentSummary = {
  id: string;
  name: string;
  assessed: number;
  paid: number;
  balance: number;
  transactions: number;
};

async function getParentPaymentsData(userId: string) {
  await dbConnect();

  const students = await Student.find({ parentUserId: userId })
    .select("_id personalInfo")
    .lean();
  const studentIds = students.map((student) => student._id);

  if (studentIds.length === 0) {
    return {
      payments: [],
      studentSummaries: [] as StudentSummary[],
      totalPaid: 0,
      totalAssessed: 0,
      totalBalance: 0,
    };
  }

  const [payments, enrollments] = await Promise.all([
    Payment.find({
      studentId: { $in: studentIds },
      isVoided: false,
    })
      .populate("studentId", "personalInfo studentId")
      .populate("enrollmentId", "enrollmentNumber")
      .sort({ paymentDate: -1 })
      .lean(),
    Enrollment.find({
      studentId: { $in: studentIds },
      isDraft: false,
    })
      .select("studentId assessedFees")
      .lean(),
  ]);

  const summaryByStudent = new Map<string, StudentSummary>();

  for (const student of students) {
    const id = student._id.toString();
    summaryByStudent.set(id, {
      id,
      name: `${student.personalInfo?.firstName || ""} ${
        student.personalInfo?.lastName || ""
      }`.trim(),
      assessed: 0,
      paid: 0,
      balance: 0,
      transactions: 0,
    });
  }

  for (const enrollment of enrollments as any[]) {
    const studentId = enrollment.studentId?.toString();
    if (!studentId) continue;
    const current = summaryByStudent.get(studentId);
    if (!current) continue;
    current.assessed += Number(enrollment.assessedFees?.totalAmount || 0);
  }

  for (const payment of payments as any[]) {
    const studentId = payment.studentId?._id?.toString?.() || payment.studentId?.toString?.();
    if (!studentId) continue;
    const current = summaryByStudent.get(studentId);
    if (!current) continue;
    current.paid += Number(payment.amount || 0);
    current.transactions += 1;
  }

  const studentSummaries = Array.from(summaryByStudent.values()).map((summary) => ({
    ...summary,
    balance: Math.max(summary.assessed - summary.paid, 0),
  }));

  const totalPaid = studentSummaries.reduce((sum, summary) => sum + summary.paid, 0);
  const totalAssessed = studentSummaries.reduce(
    (sum, summary) => sum + summary.assessed,
    0
  );
  const totalBalance = Math.max(totalAssessed - totalPaid, 0);

  return { payments, studentSummaries, totalPaid, totalAssessed, totalBalance };
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash":
      return "Cash";
    case "gcash":
      return "GCash";
    case "bank_transfer":
      return "Bank Transfer";
    case "check":
      return "Check";
    default:
      return method;
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ParentPaymentsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const { payments, studentSummaries, totalPaid, totalAssessed, totalBalance } =
    await getParentPaymentsData(userId);

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Fee &amp; Payment</h1>
        <p className="text-xs text-slate-500">Payment records and balance summary for your enrolled children</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Assessed</p>
              <p className="text-sm font-bold">{formatCurrency(totalAssessed)}</p>
            </div>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="text-xs text-muted-foreground">Remaining Balance</p>
              <p className="text-sm font-bold text-amber-700">{formatCurrency(totalBalance)}</p>
            </div>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-sm font-bold">{payments.length}</p>
            </div>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Per-Child Summary */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Per-Child Balance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {studentSummaries.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No child records found.</p>
          ) : (
            studentSummaries.map((summary) => (
              <div
                key={summary.id}
                className="flex flex-col gap-2 rounded-lg border bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{summary.name || "Unnamed student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {summary.transactions} {summary.transactions === 1 ? "transaction" : "transactions"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="info" className="text-xs px-2 py-0.5">
                    Assessed: {formatCurrency(summary.assessed)}
                  </Badge>
                  <Badge variant="success" className="text-xs px-2 py-0.5">
                    Paid: {formatCurrency(summary.paid)}
                  </Badge>
                  <Badge variant={summary.balance > 0 ? "warning" : "success"} className="text-xs px-2 py-0.5 font-semibold">
                    Balance: {formatCurrency(summary.balance)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Receipt className="h-4 w-4 text-primary" />
              Payment Transactions
            </CardTitle>
            <span className="text-xs text-muted-foreground">{payments.length} {payments.length === 1 ? "transaction" : "transactions"}</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Receipt className="mb-2 h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">No Payments Yet</p>
              <p className="text-xs text-muted-foreground">Transactions will appear here once posted by the registrar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment: any) => (
                <div
                  key={payment._id}
                  className="flex flex-col gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-emerald-100 p-1.5 mt-0.5">
                      <Wallet className="h-3.5 w-3.5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{payment.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.studentId?.personalInfo?.firstName}{" "}
                        {payment.studentId?.personalInfo?.lastName}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="font-mono">#{payment.receiptNumber}</span>
                        <span>•</span>
                        <span>{getPaymentMethodLabel(payment.paymentMethod)}</span>
                        <span>•</span>
                        <span>{payment.enrollmentId?.enrollmentNumber || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0.5">
                    <p className="text-sm font-bold text-emerald-700">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                    <Badge variant="neutral" className="text-xs px-1.5 py-0">
                      {payment.paymentType}
                    </Badge>
                    {!payment.isVoided && (
                      <a
                        href={`/api/payments/${payment._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        Invoice
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
