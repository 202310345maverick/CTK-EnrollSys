"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function FormSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled,
  className,
}: FormSelectProps) {
  return (
    <SelectPrimitive.Root
      value={value || ""}
      onValueChange={(v) => onChange?.(v)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm",
          "focus:outline-none focus:ring-1 focus:ring-[#b4040d] focus:border-[#b4040d]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[placeholder]:text-gray-400",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-1"
          )}
        >
          <SelectPrimitive.Viewport className="max-h-60 p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none",
                  "hover:bg-[#b4040d]/5 focus:bg-[#b4040d]/10",
                  "data-[state=checked]:font-semibold data-[state=checked]:text-[#b4040d]",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto">
                  <Check className="h-3.5 w-3.5 text-[#b4040d]" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
