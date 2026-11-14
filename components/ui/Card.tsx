import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[24px] border border-white/14 bg-[#5a655d]/90 backdrop-blur-xl shadow-[0_12px_30px_rgba(16,22,18,0.2)]",
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
        <div className="font-mono-obra text-2xl font-bold text-white">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-obra-text-faint">{hint}</div>}
      </div>
      {icon && <div className="text-obra-yellow">{icon}</div>}
    </Card>
  );
}

/**
 * Tarjeta hero táctica (Dark Olive Glass) — panel de mando con vidrio oliva
 * traslúcido, iluminación cálida superior y acentos en Pistachio-Lime (#D7DC9A).
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
    <div className="relative overflow-hidden rounded-[26px] border border-white/16 bg-[#556058]/90 p-5 backdrop-blur-xl shadow-[0_14px_34px_rgba(14,19,15,0.26)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-65"
        style={{
          background:
            "radial-gradient(110% 130% at 85% 0%, rgba(215,220,154,0.22) 0%, rgba(224,130,109,0.12) 40%, transparent 70%)",
        }}
      />
      <div className="relative flex items-start justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-obra-text-dim">
          {label}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-obra-yellow">
            {icon}
          </div>
        )}
      </div>
      <div className="relative mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono-obra text-4xl font-bold leading-none text-white">
            {value}
          </div>
          {sub && <div className="mt-1.5 text-xs text-obra-text-faint">{sub}</div>}
        </div>
        {chart && <div className="h-9 w-28 shrink-0">{chart}</div>}
      </div>
    </div>
  );
}
