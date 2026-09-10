"use client";

import React from "react";
import Image from "next/image";

type Item = { qty: number; description: string; unitPrice: number };

type Props = {
  schoolName?: string;
  schoolSubtitle?: string;
  logoSrc?: string;
  receiptNumber?: string;
  receiptDate?: string;
  payerName?: string;
  items?: Item[];
  currency?: string;
};

function fmt(amount: number, currency = "PHP") {
  if (currency === "PHP") {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₱ ${amount.toFixed(2)}`;
  }
}

export default function OfficialReceipt({
  schoolName = "Christ the King Catholic School",
  schoolSubtitle = "Official Receipt",
  logoSrc = "/images/ctk-logo.svg",
  receiptNumber = "0001001",
  receiptDate = new Date().toLocaleDateString("en-PH"),
  payerName = "Student Name",
  items = [],
  currency = "PHP",
}: Props) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  return (
    <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-5 text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:p-0 print:shadow-none print:rounded-none">
      <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#c7d3e6] bg-white shadow-sm">
              <Image src={logoSrc} alt="CTK logo" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <div className="text-[1.5rem] font-bold tracking-tight text-slate-800">{schoolName}</div>
              <div className="text-sm font-medium text-slate-500">{schoolSubtitle}</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-right shadow-sm">
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-blue-700">Official</div>
            <div className="text-3xl font-black tracking-tight text-slate-800">RECEIPT</div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payee</div>
            <div className="mt-2 text-[1.8rem] font-bold leading-tight text-slate-900">{payerName}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm text-slate-700">
              <span className="font-semibold">Receipt #</span>
              <span className="text-right font-semibold text-slate-900">{receiptNumber}</span>

              <span className="font-semibold">Date</span>
              <span className="text-right font-semibold text-slate-900">{receiptDate}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-[0.98rem]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.18em]">Qty</th>
                <th className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.18em]">Description</th>
                <th className="px-4 py-3 text-right text-[0.72rem] font-bold uppercase tracking-[0.18em]">Unit Price</th>
                <th className="px-4 py-3 text-right text-[0.72rem] font-bold uppercase tracking-[0.18em]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">No items</td>
                </tr>
              ) : (
                items.map((it, i) => (
                  <tr key={i} className="border-b border-slate-200 bg-white last:border-b-0">
                    <td className="px-4 py-4 align-top font-semibold text-slate-800">{it.qty}</td>
                    <td className="px-4 py-4 align-top text-slate-700">{it.description}</td>
                    <td className="px-4 py-4 align-top text-right text-slate-700">{fmt(it.unitPrice, currency)}</td>
                    <td className="px-4 py-4 align-top text-right font-semibold text-slate-800">{fmt(it.qty * it.unitPrice, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <div className="flex items-center justify-between gap-4 text-base font-semibold text-slate-700">
              <span>Total</span>
              <span className="text-[1.7rem] font-black tracking-tight text-slate-900">{fmt(subtotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
