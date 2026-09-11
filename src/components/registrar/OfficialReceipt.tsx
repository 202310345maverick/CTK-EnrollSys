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
  const peso = (amount: number) => `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto w-full max-w-[1200px] rounded-[24px] bg-[#f3f5f7] p-3 print:p-0 sm:p-5">
      <div className="rounded-[20px] bg-[#f6f8fb] px-4 py-4 md:px-7 md:py-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full border-2 border-[#dfeaf5] bg-white shadow-sm md:h-[84px] md:w-[84px]">
              <Image src={logoSrc} alt="CTK logo" width={74} height={74} className="object-contain" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-[1.4rem] font-black tracking-[-0.04em] text-slate-900 sm:text-[1.8rem] md:text-[2.5rem]">
                {schoolName}
              </div>
              <div className="text-base font-medium text-slate-600 md:text-xl">{schoolSubtitle}</div>
            </div>
          </div>

          <div className="shrink-0 text-left md:ml-auto md:text-right">
            <div className="text-[2rem] font-black leading-none tracking-[-0.04em] text-slate-900 sm:text-[2.8rem] md:text-[3.6rem]">
              RECEIPT
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-[16px] bg-[#dfeaf5] px-4 py-4 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr] lg:items-end">
            <div className="min-w-0">
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-600 sm:text-[0.8rem]">To</div>
              <div className="mt-2 break-words text-[1.5rem] font-black leading-none tracking-[-0.04em] text-slate-900 sm:text-[2.2rem] md:text-[3rem]">
                {payerName}
              </div>
            </div>

            <div className="w-full text-[0.9rem] text-slate-700 sm:text-[1.05rem] lg:ml-auto lg:max-w-[390px]">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] table-fixed border-collapse text-left text-[1.1rem]">
              <thead>
                <tr className="bg-[#0f172a] text-white">
                  <th className="w-[12%] px-4 py-4 text-left text-[0.8rem] font-bold uppercase tracking-[0.18em]">Qty</th>
                  <th className="w-[42%] px-4 py-4 text-left text-[0.8rem] font-bold uppercase tracking-[0.18em]">Description</th>
                  <th className="w-[18%] px-4 py-4 text-right text-[0.8rem] font-bold uppercase tracking-[0.18em]">Unit Price</th>
                  <th className="w-[28%] px-4 py-4 text-right text-[0.8rem] font-bold uppercase tracking-[0.18em]">Amount</th>
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
                      <td className="px-4 py-5 align-top text-right text-slate-700">{peso(it.unitPrice)}</td>
                      <td className="px-4 py-5 align-top text-right font-bold whitespace-nowrap text-slate-900">{peso(it.qty * it.unitPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-[430px] rounded-[16px] bg-[#dfeaf5] px-5 py-4">
            <div className="flex items-center justify-between gap-4 text-[1.8rem] font-medium text-slate-700">
              <span className="font-semibold">Total</span>
              <span className="font-black tracking-[-0.05em] text-slate-900">{peso(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
