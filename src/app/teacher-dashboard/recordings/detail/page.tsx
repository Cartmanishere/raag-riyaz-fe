"use client";

import { useSearchParams } from "next/navigation";
import RecordingDetailPageClient from "@/components/Recordings/RecordingDetailPageClient";

function readRecordingId(rawId: string | null) {
  return rawId ?? "";
}

export default function RecordingDetailPage() {
  const searchParams = useSearchParams();
  const id = readRecordingId(searchParams.get("id"));

  return <RecordingDetailPageClient id={id} />;
}
