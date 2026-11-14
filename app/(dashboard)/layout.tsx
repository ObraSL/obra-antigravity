import { ObraProvider } from "@/lib/obra-context";
import { MiembroProvider } from "@/lib/miembro-context";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { AccesoGate } from "@/components/layout/AccesoGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <MiembroProvider>
        <AccesoGate>
          <ObraProvider>
            <DashboardShell>{children}</DashboardShell>
          </ObraProvider>
        </AccesoGate>
      </MiembroProvider>
    </AuthGate>
  );
}
