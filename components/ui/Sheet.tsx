"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "./Button";
import { tr } from "@/lib/i18n";

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-obra-line bg-obra-bg-elevated p-[18px] pb-7 md:rounded-2xl md:border"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-2xl font-bold uppercase tracking-wide text-obra-text">
            {title}
          </div>
          <IconButton onClick={onClose} aria-label={tr("Cerrar")}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
