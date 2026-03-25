"use client";

import { useSearchParams } from "next/navigation";
import BatchDetailPageClient from "@/components/Batches/BatchDetailPageClient";

function readBatchId(rawId: string | null) {
  return rawId ?? "";
}

export default function BatchDetailPage() {
  const searchParams = useSearchParams();
  const id = readBatchId(searchParams.get("id"));

  return <BatchDetailPageClient id={id} />;
}
