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
  try {
    return amount.toLocaleString("en-PH", { style: "currency", currency });
  } catch {
    return `₱ ${amount.toFixed(2)}`;
  }
}

export default function OfficialReceipt({
  schoolName = "Christ the King Catholic School",
  schoolSubtitle = "Official Receipt",
  logoSrc = "/images/ctk.png",
  receiptNumber = "0001001",
  receiptDate = new Date().toLocaleDateString("en-PH"),
  payerName = "Student Name",
  items = [],
  currency = "PHP",
}: Props) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  return (
    <div className="mx-auto max-w-5xl bg-white p-6 text-slate-800 print:p-0">
      <div className="mb-12 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm">
            <Image src={logoSrc} alt="CTK logo" width={52} height={52} className="object-contain" />
          </div>
          <div>
            <div className="text-[1.7rem] font-semibold tracking-tight text-slate-800">{schoolName}</div>
            <div className="text-sm text-slate-500">{schoolSubtitle}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-5xl font-black tracking-tight text-slate-700">RECEIPT</div>
        </div>
      </div>

      <div className="mb-10 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="text-xl font-semibold text-slate-700">To</div>
          <div className="mt-3 text-[2rem] font-semibold leading-tight text-slate-800">{payerName}</div>
        </div>

        <div className="ml-auto w-full max-w-md">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-8 gap-y-4 text-[1.1rem] text-slate-700">
            <span className="font-semibold">Receipt #</span>
            <span className="text-right font-medium text-slate-900">{receiptNumber}</span>

            <span className="font-semibold">Receipt Date</span>
            <span className="text-right font-medium text-slate-900">{receiptDate}</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-none border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-[1.05rem]">
          <thead>
            <tr className="bg-[#3a4048] text-white">
              <th className="px-5 py-4 text-left font-bold uppercase tracking-wide">QTY</th>
              <th className="px-5 py-4 text-left font-bold uppercase tracking-wide">Description</th>
              <th className="px-5 py-4 text-right font-bold uppercase tracking-wide">Unit Price</th>
              <th className="px-5 py-4 text-right font-bold uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">No items</td>
              </tr>
            ) : (
              items.map((it, i) => (
                <tr key={i} className="border-b border-slate-200 bg-white">
                  <td className="px-5 py-5 align-top font-semibold text-slate-800">{it.qty}</td>
                  <td className="px-5 py-5 align-top text-slate-700">{it.description}</td>
                  <td className="px-5 py-5 align-top text-right text-slate-700">{fmt(it.unitPrice, currency)}</td>
                  <td className="px-5 py-5 align-top text-right font-semibold text-slate-800">{fmt(it.qty * it.unitPrice, currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-0 flex justify-end">
        <div className="w-full max-w-md border border-t-0 border-slate-200 bg-slate-100">
          <div className="flex items-center justify-between px-5 py-4 text-[1.05rem] font-semibold text-slate-700">
            <span>Total ({currency === "PHP" ? "₱" : currency})</span>
            <span className="text-[1.7rem] font-black tracking-tight text-slate-800">{fmt(subtotal, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
