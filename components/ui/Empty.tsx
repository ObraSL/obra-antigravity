import type { LucideIcon } from "lucide-react";

export function Empty({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub?: string }) {
  return (
    <div className="py-12 text-center text-obra-text-faint">
      <Icon size={30} className="mx-auto mb-2.5 opacity-60" />
      <div className="text-[15px] font-semibold text-obra-text-dim">{title}</div>
      {sub && <div className="mt-1 text-[13px]">{sub}</div>}
    </div>
  );
}
