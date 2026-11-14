"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "flex w-full min-h-[50px] items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-[15px] font-bold transition-all shadow-[0_6px_20px_rgba(20,24,20,0.22)]",
        disabled
          ? "cursor-not-allowed bg-obra-yellow-dim text-obra-yellow-ink/60 opacity-60 shadow-none"
          : "bg-[#d7dc9a] text-[#141814] hover:brightness-105 active:scale-[0.99]",
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
        "flex w-full min-h-[46px] items-center justify-center rounded-[16px] border border-white/15 bg-[#0e0c0d]/85 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0e0c0d] active:scale-[0.99]",
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
        "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-[16px] bg-[#e0826d] px-4 py-3 text-[15px] font-bold text-[#141814] transition-all hover:brightness-95 active:scale-[0.99] shadow-xs",
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
        "flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-white/16 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/15 active:bg-white/20 disabled:opacity-35",
        className
      )}
      {...rest}
    />
  );
}
