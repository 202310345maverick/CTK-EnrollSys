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
  const value = amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === "PHP") {
    return `₱${value}`;
  }

  try {
    return `${currency} ${value}`;
  } catch {
    return `₱${value}`;
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
    <div className="mx-auto w-full max-w-[980px] overflow-hidden rounded-[26px] border border-slate-300 bg-white p-4 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] print:p-0 print:shadow-none print:rounded-none">
      <div className="rounded-[22px] border border-slate-300 bg-slate-50/80 p-4 md:p-5">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d5dfe9] bg-white shadow-sm md:h-20 md:w-20">
              <Image src={logoSrc} alt="CTK logo" width={60} height={60} className="object-contain" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-black tracking-tight text-slate-800 md:text-[2rem]">{schoolName}</div>
              <div className="text-sm text-slate-500 md:text-base">{schoolSubtitle}</div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[2.3rem] font-black leading-none tracking-tight text-slate-800 md:text-[3.1rem]">RECEIPT</div>
          </div>
        </div>

        <div className="mb-5 rounded-[18px] bg-[#e8edf5] p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr] md:items-end">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-600">To</div>
              <div className="mt-1 text-[2rem] font-black leading-none tracking-tight text-slate-900 md:text-[2.5rem]">{payerName}</div>
            </div>

            <div className="ml-auto w-full max-w-md text-sm md:text-base">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-slate-700">
                <span className="font-semibold">Receipt #</span>
                <span className="text-right font-bold text-slate-900">{receiptNumber}</span>

                <span className="font-semibold">Receipt Date</span>
                <span className="text-right font-bold text-slate-900">{receiptDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
          <table className="w-full table-fixed border-collapse text-left text-sm md:text-[1.04rem]">
            <thead>
              <tr className="bg-[#1f2937] text-white">
                <th className="w-[12%] px-3 py-3 text-left text-[0.68rem] font-bold uppercase tracking-[0.18em] md:px-4">Qty</th>
                <th className="w-[46%] px-3 py-3 text-left text-[0.68rem] font-bold uppercase tracking-[0.18em] md:px-4">Description</th>
                <th className="w-[21%] px-3 py-3 text-right text-[0.68rem] font-bold uppercase tracking-[0.18em] md:px-4">Unit Price</th>
                <th className="w-[21%] px-3 py-3 text-right text-[0.68rem] font-bold uppercase tracking-[0.18em] md:px-4">Amount</th>
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
                    <td className="px-3 py-4 align-top font-semibold text-slate-800 md:px-4">{it.qty}</td>
                    <td className="px-3 py-4 align-top text-slate-700 md:px-4">{it.description}</td>
                    <td className="px-3 py-4 align-top text-right text-slate-700 md:px-4">{fmt(it.unitPrice, currency)}</td>
                    <td className="px-3 py-4 align-top text-right font-semibold text-slate-800 md:px-4">{fmt(it.qty * it.unitPrice, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-[420px] rounded-[14px] border border-slate-200 bg-slate-100 p-4">
            <div className="flex items-center justify-between gap-4 text-lg font-semibold text-slate-700">
              <span>Total</span>
              <span className="text-[2rem] font-black tracking-tight text-slate-900 md:text-[2.4rem]">{fmt(subtotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
