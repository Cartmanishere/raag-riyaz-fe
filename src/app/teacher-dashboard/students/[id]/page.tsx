import StudentDetailPageClient from "@/components/Students/StudentDetailPageClient";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StudentDetailPageClient id={id} />;
}
