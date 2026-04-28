import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import Student from "@/models/Student";
import Enrollment from "@/models/Enrollment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Receipt, Wallet, AlertCircle } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment History</h2>
        <p className="text-muted-foreground">
          Live payment records and balance summary for your enrolled children.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assessed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssessed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="ctk-panel">
        <CardHeader>
          <CardTitle className="ctk-section-title">Per-Child Balance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {studentSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No child records found.</p>
          ) : (
            studentSummaries.map((summary) => (
              <div
                key={summary.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-semibold">{summary.name || "Unnamed student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {summary.transactions} payment transaction(s)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="info">Assessed: {formatCurrency(summary.assessed)}</Badge>
                  <Badge variant="success">Paid: {formatCurrency(summary.paid)}</Badge>
                  <Badge variant={summary.balance > 0 ? "warning" : "success"}>
                    Balance: {formatCurrency(summary.balance)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payments yet</h3>
              <p className="text-muted-foreground">
                Payment transactions will appear here once posted by the registrar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: any) => (
                <div
                  key={payment._id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-emerald-100 p-2">
                      {payment.amount > 0 ? (
                        <Wallet className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.studentId?.personalInfo?.firstName}{" "}
                        {payment.studentId?.personalInfo?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Receipt: {payment.receiptNumber} •{" "}
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Enrollment: {payment.enrollmentId?.enrollmentNumber || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-700">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.paymentDate)}
                    </p>
                    <div className="mt-1">
                      <Badge variant="neutral">
                        <CreditCard className="mr-1 h-3 w-3" />
                        {payment.paymentType}
                      </Badge>
                    </div>
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
