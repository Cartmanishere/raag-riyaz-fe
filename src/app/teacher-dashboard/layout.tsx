import DashboardShell from "@/components/DashboardShell/DashboardShell";

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
