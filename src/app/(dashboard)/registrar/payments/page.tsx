import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import dbConnect from "@/lib/db/connection";
import Payment from "@/models/Payment";
import "@/models/Student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Search, Filter, Plus, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const getPaymentMethodVariant = (method: string): NonNullable<BadgeProps["variant"]> => {
    switch (method) {
      case "cash": return "success";
      case "gcash": return "info";
      case "bank_transfer": return "default";
      case "check": return "pending";
      default: return "neutral";
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
      <PageHeader
        title="Fee Assessment & Payment Recording"
        description="Manage student fees and record payments"
        actions={
        <Button className="ctk-danger-button">
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="ctk-stat-card p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card className="ctk-stat-card p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card className="ctk-stat-card p-0">
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

      <Card className="ctk-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="ctk-section-title">Payment History</CardTitle>
              <CardDescription>{payments.length} transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search payments..."
                  className="ctk-input w-64 pl-9"
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
            <Table className="ctk-table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-mono text-sm">{payment.receiptNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.studentId?.personalInfo?.firstName} {payment.studentId?.personalInfo?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{payment.studentId?.studentId || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>
                        <Badge variant={getPaymentMethodVariant(payment.paymentMethod)}>
                          {payment.paymentMethod.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
