import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

async function getPayments() {
  await dbConnect();
  const payments = await Payment.find({ isVoided: false })
    .populate("studentId", "personalInfo studentId")
    .populate("receivedBy", "name")
    .sort({ paymentDate: -1 })
    .lean();
  
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  
  return { payments, totalAmount };
}

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  const { payments, totalAmount } = await getPayments();

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "cash": return "bg-green-100 text-green-800";
      case "gcash": return "bg-blue-100 text-blue-800";
      case "bank_transfer": return "bg-purple-100 text-purple-800";
      case "check": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            Record and track payment transactions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.length > 0 ? formatCurrency(totalAmount / payments.length) : "₱0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>{payments.length} transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  className="pl-9 pr-4 py-2 border rounded-md text-sm w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payments recorded</h3>
              <p className="text-muted-foreground">Start by recording a payment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Receipt #</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: any) => (
                    <tr key={payment._id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-sm">{payment.receiptNumber}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {payment.studentId?.personalInfo?.firstName} {payment.studentId?.personalInfo?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{payment.studentId?.studentId || "—"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{payment.description}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getPaymentMethodColor(payment.paymentMethod)}`}>
                          {payment.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(payment.paymentDate)}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
