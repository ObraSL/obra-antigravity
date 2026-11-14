import clsx from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
        {label}
      </div>
      {children}
    </div>
  );
}

const fieldClass =
  "w-full rounded-[14px] border border-white/16 bg-[#4b544d]/85 px-3.5 py-3 text-[15px] text-white placeholder:text-white/45 outline-none transition-colors focus:border-obra-yellow";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldClass, className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(fieldClass, className)} {...rest} />;
}
