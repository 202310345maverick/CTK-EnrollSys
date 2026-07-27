import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatCurrency } from "@/lib/utils";

export interface PaymentReceiptDetails {
  receiptNumber: string;
  studentName: string;
  paymentDate: string;
  paymentType?: string;
  description?: string;
  paymentMethod?: string;
  remarks?: string;
  receivedBy?: string;
  amount: number;
}

export function buildPaymentReceiptPdf(details: PaymentReceiptDetails): Buffer {
  const doc = new jsPDF();
  const topMargin = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Christ the King Catholic School", 20, topMargin);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Official Payment Receipt", 20, topMargin + 8);
  doc.setLineWidth(0.5);
  doc.line(20, topMargin + 11, 190, topMargin + 11);

  doc.setFontSize(11);
  doc.text(`Receipt No: ${details.receiptNumber}`, 20, topMargin + 20);
  doc.text(`Date: ${details.paymentDate}`, 150, topMargin + 20, { align: "right" });
  doc.text(`Student: ${details.studentName || "—"}`, 20, topMargin + 30);
  doc.text(`Payment Type: ${details.paymentType || "—"}`, 20, topMargin + 38);
  doc.text(`Payment Method: ${details.paymentMethod || "—"}`, 20, topMargin + 46);

  if (details.receivedBy) {
    doc.text(`Received By: ${details.receivedBy}`, 20, topMargin + 54);
  }

  if (details.description) {
    const descriptionY = details.receivedBy ? topMargin + 62 : topMargin + 54;
    doc.text(`Description: ${details.description}`, 20, descriptionY);
  }

  if (details.remarks) {
    const remarksY = details.description
      ? topMargin + 70
      : details.receivedBy
      ? topMargin + 62
      : topMargin + 54;
    doc.text(`Remarks: ${details.remarks}`, 20, remarksY);
  }

  const tableStartY = details.remarks
    ? topMargin + 80
    : details.description
    ? topMargin + 76
    : details.receivedBy
    ? topMargin + 70
    : topMargin + 62;

  try {
    // @ts-ignore
    if ((doc as any).autoTable) {
      // @ts-ignore
      (doc as any).autoTable({
        startY: tableStartY,
        head: [["Description", "Amount"]],
        body: [[details.description || "Payment", formatCurrency(details.amount)]],
        theme: "grid",
        headStyles: { fillColor: [180, 4, 13], textColor: 255 },
        styles: { fontSize: 10, halign: "right" },
        columnStyles: { 0: { halign: "left" }, 1: { halign: "right" } },
      });
    }
  } catch {
    // ignore autoTable errors
  }

  const finalY = (doc as any).lastAutoTable?.finalY ?? tableStartY + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total: ${formatCurrency(details.amount)}`, 190, finalY + 10, { align: "right" });

  if (details.receivedBy) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Prepared by: ${details.receivedBy}`, 20, finalY + 20);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
