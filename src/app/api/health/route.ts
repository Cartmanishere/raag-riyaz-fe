import { NextResponse } from "next/server";
import { HealthStatus } from "@/types";

export async function GET() {
  const health: HealthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return NextResponse.json({
    data: health,
    message: "Server is healthy",
    success: true,
  });
}
