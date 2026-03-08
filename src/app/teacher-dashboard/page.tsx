import { redirect } from "next/navigation";

export default function TeacherDashboardPage() {
  redirect("/teacher-dashboard/students");
}
