import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import Student from "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

async function getPayments(userId: string) {
  await dbConnect();
  
  // Get student IDs for this parent
  const students = await Student.find({ parentUserId: userId }).select("_id").lean();
  const studentIds = students.map((s) => s._id);
  
  const payments = await Payment.find({ 
    studentId: { $in: studentIds },
    isVoided: false 
  })
    .populate("studentId", "personalInfo studentId")
    .sort({ paymentDate: -1 })
    .lean();
  
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  
  return { payments, totalPaid };
}

export default async function ParentPaymentsPage() {
  const session = await getServerSession(authOptions);
  const { payments, totalPaid } = await getPayments(session?.user?.id || "");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Cash";
      case "gcash": return "GCash";
      case "bank_transfer": return "Bank Transfer";
      case "check": return "Check";
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
        <p className="text-muted-foreground">
          View your payment history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All payments made for your children</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payments yet</h3>
              <p className="text-muted-foreground">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: any) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.studentId?.personalInfo?.firstName} {payment.studentId?.personalInfo?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Receipt: {payment.receiptNumber} • {getPaymentMethodLabel(payment.paymentMethod)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.paymentDate)}</p>
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
