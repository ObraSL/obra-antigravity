"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-obra-text/10 px-4 py-3 text-[15px] font-bold transition-all shadow-[0_2px_8px_rgba(212,229,101,0.25)]",
        disabled
          ? "cursor-not-allowed bg-obra-yellow-dim text-obra-yellow-ink/60 opacity-60 shadow-none"
          : "bg-obra-yellow text-obra-yellow-ink hover:brightness-95 active:scale-[0.99]",
        className
      )}
      {...rest}
    />
  );
}

export function GhostButton({ className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        "flex w-full min-h-[44px] items-center justify-center rounded-xl border border-obra-line px-4 py-2.5 text-sm font-semibold text-obra-text-dim transition-colors hover:border-obra-text-faint hover:text-obra-text active:bg-obra-card",
        className
      )}
      {...rest}
    />
  );
}

export function DangerButton({ className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-obra-red px-4 py-3 text-[15px] font-bold text-white transition-all hover:brightness-95 active:scale-[0.99] shadow-xs",
        className
      )}
      {...rest}
    />
  );
}

export function IconButton({ className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        "flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-obra-card-border bg-obra-card text-obra-text transition-colors hover:border-obra-text-faint active:bg-obra-bg disabled:opacity-35",
        className
      )}
      {...rest}
    />
  );
}
