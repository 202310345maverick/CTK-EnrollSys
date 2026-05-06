"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

type DatePickerProps = {
  value?: string;           // ISO date string "YYYY-MM-DD"
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxYear?: number;
  minYear?: number;
};

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(date: Date | null): string {
  if (!date) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  disabled,
  className,
  maxYear = new Date().getFullYear(),
  minYear = 1950,
}: DatePickerProps) {
  const selected = parseDate(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear() - 10);
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const [mode, setMode] = useState<"calendar" | "month" | "year">("calendar");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("calendar");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const openPicker = () => {
    if (disabled) return;
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
    setMode("calendar");
    setOpen(true);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const selectDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    onChange?.(toISO(date));
    setOpen(false);
    setMode("calendar");
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (day: number) =>
    selected &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  // Year range for year picker
  const yearRange: number[] = [];
  for (let y = maxYear; y >= minYear; y--) yearRange.push(y);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm",
          "focus:outline-none focus:ring-1 focus:ring-[#b4040d] focus:border-[#b4040d]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-gray-400"
        )}
      >
        <span>{selected ? formatDisplay(selected) : placeholder}</span>
        <Calendar className="h-3.5 w-3.5 text-gray-400 ml-2 flex-shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-72 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {/* ── Calendar view ───────────────────────── */}
          {mode === "calendar" && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between bg-[#b4040d] px-3 py-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="rounded p-1 text-white/80 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMode("month")}
                  className="text-sm font-semibold text-white hover:text-white/80 transition-colors"
                >
                  {MONTHS[viewMonth]} {viewYear}
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded p-1 text-white/80 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                {DAYS.map((d) => (
                  <div key={d} className="py-1.5 text-center text-xs font-semibold text-gray-500">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 p-2 gap-0.5">
                {cells.map((day, i) => (
                  <div key={i} className="aspect-square">
                    {day !== null ? (
                      <button
                        type="button"
                        onClick={() => selectDay(day)}
                        className={cn(
                          "w-full h-full rounded-lg text-xs font-medium transition-colors",
                          isSelected(day)
                            ? "bg-[#b4040d] text-white"
                            : isToday(day)
                            ? "border border-[#b4040d] text-[#b4040d] hover:bg-[#b4040d]/10"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {day}
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-3 py-1.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode("year")}
                  className="text-xs text-[#b4040d] font-medium hover:underline"
                >
                  Change Year
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setMode("calendar"); }}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* ── Month picker ────────────────────────── */}
          {mode === "month" && (
            <>
              <div className="bg-[#b4040d] px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Select Month</span>
                <button type="button" onClick={() => setMode("calendar")} className="text-white/70 hover:text-white text-xs">Back</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-3">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setViewMonth(i); setMode("calendar"); }}
                    className={cn(
                      "rounded-lg py-2 text-xs font-medium transition-colors",
                      viewMonth === i
                        ? "bg-[#b4040d] text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-[#b4040d]/10"
                    )}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Year picker ─────────────────────────── */}
          {mode === "year" && (
            <>
              <div className="bg-[#b4040d] px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Select Year</span>
                <button type="button" onClick={() => setMode("calendar")} className="text-white/70 hover:text-white text-xs">Back</button>
              </div>
              <div className="max-h-52 overflow-y-auto p-2 grid grid-cols-3 gap-1.5">
                {yearRange.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewYear(y); setMode("calendar"); }}
                    className={cn(
                      "rounded-lg py-1.5 text-xs font-medium transition-colors",
                      viewYear === y
                        ? "bg-[#b4040d] text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-[#b4040d]/10"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
