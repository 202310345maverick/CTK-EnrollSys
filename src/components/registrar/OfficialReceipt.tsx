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
  const value = Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === "PHP") {
    return `₱${value}`;
  }

  return `${currency} ${value}`;
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
    <div className="mx-auto w-full max-w-[1100px] rounded-[24px] border border-[#d4dfe9] bg-[#f3f5f7] p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.25)] print:p-0 print:shadow-none">
      <div className="rounded-[20px] border border-[#d4dfe9] bg-[#f6f8fb] px-5 py-4 md:px-7 md:py-6">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border-2 border-[#dfeaf5] bg-white shadow-sm">
              <Image src={logoSrc} alt="CTK logo" width={74} height={74} className="object-contain" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-[2rem] font-black tracking-[-0.04em] text-slate-900 md:text-[2.5rem]">
                {schoolName}
              </div>
              <div className="text-xl font-medium text-slate-600">{schoolSubtitle}</div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[3rem] font-black leading-none tracking-[-0.04em] text-slate-900 md:text-[4rem]">
              RECEIPT
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-[16px] bg-[#dfeaf5] px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_0.8fr] md:items-end">
            <div className="min-w-0">
              <div className="text-[0.8rem] font-medium uppercase tracking-[0.18em] text-slate-600">To</div>
              <div className="mt-2 text-[2.2rem] font-black leading-none tracking-[-0.04em] text-slate-900 md:text-[3rem]">
                {payerName}
              </div>
            </div>

            <div className="ml-auto w-full max-w-[390px] text-[1.05rem] text-slate-700">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
                <span className="font-medium">Receipt #</span>
                <span className="text-right font-bold text-slate-900">{receiptNumber}</span>

                <span className="font-medium">Receipt Date</span>
                <span className="text-right font-bold text-slate-900">{receiptDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
          <table className="w-full table-fixed border-collapse text-left text-[1.1rem]">
            <thead>
              <tr className="bg-[#0f172a] text-white">
                <th className="w-[12%] px-4 py-4 text-left text-[0.8rem] font-bold uppercase tracking-[0.18em]">Qty</th>
                <th className="w-[42%] px-4 py-4 text-left text-[0.8rem] font-bold uppercase tracking-[0.18em]">Description</th>
                <th className="w-[23%] px-4 py-4 text-right text-[0.8rem] font-bold uppercase tracking-[0.18em]">Unit Price</th>
                <th className="w-[23%] px-4 py-4 text-right text-[0.8rem] font-bold uppercase tracking-[0.18em]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">No items</td>
                </tr>
              ) : (
                items.map((it, i) => (
                  <tr key={i} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-5 align-top font-bold text-slate-800">{it.qty}</td>
                    <td className="px-4 py-5 align-top text-slate-700">{it.description}</td>
                    <td className="px-4 py-5 align-top text-right text-slate-700">{fmt(it.unitPrice, currency)}</td>
                    <td className="px-4 py-5 align-top text-right font-bold whitespace-nowrap text-slate-900">{fmt(it.qty * it.unitPrice, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-[430px] rounded-[16px] bg-[#dfeaf5] px-5 py-4">
            <div className="flex items-center justify-between gap-4 text-[1.8rem] font-medium text-slate-700">
              <span className="font-semibold">Total</span>
              <span className="font-black tracking-[-0.05em] text-slate-900">{fmt(subtotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
