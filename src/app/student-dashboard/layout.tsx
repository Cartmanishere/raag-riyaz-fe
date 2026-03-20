import StudentDashboardShell from "@/components/StudentDashboard/StudentDashboardShell";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentDashboardShell>{children}</StudentDashboardShell>;
}
