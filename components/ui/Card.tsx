import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-obra-card-border bg-obra-card shadow-[0_2px_10px_rgba(20,25,21,0.05)]",
        className
      )}
      {...rest}
    />
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
          {label}
        </div>
        <div className="font-mono-obra text-2xl font-bold text-obra-text">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-obra-text-faint">{hint}</div>}
      </div>
      {icon && <div className="text-obra-text-faint">{icon}</div>}
    </Card>
  );
}

/**
 * Tarjeta hero táctica (Tactical Architectural Slate) — panel de mando de alta
 * visibilidad en pizarra profunda (#1E2520), con métrica grande en blanco hueso
 * y acentos en Signal Lime (#D4E565) / Esmeralda.
 */
export function HeroStatCard({
  label,
  value,
  sub,
  chart,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  chart?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-obra-slate-border bg-obra-slate p-5 shadow-[0_12px_28px_rgba(15,20,16,0.22)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(110% 130% at 95% 5%, rgba(212,229,101,0.18) 0%, rgba(52,211,153,0.08) 35%, transparent 65%)",
        }}
      />
      <div className="relative flex items-start justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-[#A3B1A7]">
          {label}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-obra-slate-card text-obra-yellow border border-obra-slate-border">
            {icon}
          </div>
        )}
      </div>
      <div className="relative mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono-obra text-4xl font-bold leading-none text-[#F7F9F5]">
            {value}
          </div>
          {sub && <div className="mt-1.5 text-xs text-[#A3B1A7]">{sub}</div>}
        </div>
        {chart && <div className="h-9 w-28 shrink-0">{chart}</div>}
      </div>
    </div>
  );
}
