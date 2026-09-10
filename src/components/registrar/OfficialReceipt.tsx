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
    return `₱ ${value}`;
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
    <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-[22px] border border-slate-300 bg-white p-3 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] print:p-0 print:shadow-none print:rounded-none">
      <div className="rounded-[18px] border border-slate-300 bg-slate-50/80 p-3 md:p-4">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d5dfe9] bg-white shadow-sm md:h-20 md:w-20">
              <Image src={logoSrc} alt="CTK logo" width={52} height={52} className="object-contain" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[1.2rem] font-black tracking-tight text-slate-800 md:text-[1.8rem]">{schoolName}</div>
              <div className="text-xs text-slate-500 md:text-sm">{schoolSubtitle}</div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[2rem] font-black leading-none tracking-tight text-slate-800 md:text-[2.7rem]">RECEIPT</div>
          </div>
        </div>

        <div className="mb-4 rounded-[14px] bg-[#e8edf5] p-3 md:p-4">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.6fr] md:items-end">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-[0.15em] text-slate-600">To</div>
              <div className="mt-1 text-[1.7rem] font-black leading-none tracking-tight text-slate-900 md:text-[2.2rem]">{payerName}</div>
            </div>

            <div className="ml-auto w-full max-w-sm text-xs md:text-sm">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2 text-slate-700">
                <span className="font-semibold">Receipt #</span>
                <span className="text-right font-bold text-slate-900">{receiptNumber}</span>

                <span className="font-semibold">Receipt Date</span>
                <span className="text-right font-bold text-slate-900">{receiptDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
          <table className="w-full table-fixed border-collapse text-left text-xs md:text-[0.96rem]">
            <thead>
              <tr className="bg-[#1f2937] text-white">
                <th className="w-[10%] px-2 py-2 text-left text-[0.63rem] font-bold uppercase tracking-[0.16em] md:px-3">Qty</th>
                <th className="w-[46%] px-2 py-2 text-left text-[0.63rem] font-bold uppercase tracking-[0.16em] md:px-3">Description</th>
                <th className="w-[22%] px-2 py-2 text-right text-[0.63rem] font-bold uppercase tracking-[0.16em] md:px-3">Unit Price</th>
                <th className="w-[22%] px-2 py-2 text-right text-[0.63rem] font-bold uppercase tracking-[0.16em] md:px-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-7 text-center text-slate-500">No items</td>
                </tr>
              ) : (
                items.map((it, i) => (
                  <tr key={i} className="border-b border-slate-200 bg-white last:border-b-0">
                    <td className="px-2 py-3 align-top font-semibold text-slate-800 md:px-3">{it.qty}</td>
                    <td className="px-2 py-3 align-top text-slate-700 md:px-3">{it.description}</td>
                    <td className="px-2 py-3 align-top text-right text-slate-700 md:px-3">{fmt(it.unitPrice, currency)}</td>
                    <td className="px-2 py-3 align-top text-right font-semibold whitespace-nowrap text-slate-800 md:px-3">{fmt(it.qty * it.unitPrice, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-[360px] rounded-[12px] border border-slate-200 bg-slate-100 p-3">
            <div className="flex items-center justify-between gap-3 text-base font-semibold text-slate-700">
              <span>Total</span>
              <span className="text-[1.7rem] font-black tracking-tight whitespace-nowrap text-slate-900 md:text-[2rem]">{fmt(subtotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
