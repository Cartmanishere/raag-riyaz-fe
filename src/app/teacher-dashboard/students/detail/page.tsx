"use client";

import { useSearchParams } from "next/navigation";
import StudentDetailPageClient from "@/components/Students/StudentDetailPageClient";

function readStudentId(rawId: string | null) {
  return rawId ?? "";
}

export default function StudentDetailPage() {
  const searchParams = useSearchParams();
  const id = readStudentId(searchParams.get("id"));

  return <StudentDetailPageClient id={id} />;
}
