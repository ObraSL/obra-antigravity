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
  "w-full rounded-[10px] border border-obra-line bg-obra-bg-elevated px-3 py-3 text-[15px] text-obra-text outline-none focus:border-obra-yellow-dim";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldClass, className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(fieldClass, className)} {...rest} />;
}
