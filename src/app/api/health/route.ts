import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/server/config";
import type { HealthStatus } from "@/lib/rag/types";

export const dynamic = "force-dynamic";

export function GET() {
  const { apiKey, provider, chatModel, embeddingModel, dimensions } = getServerConfig();
  const status: HealthStatus = { configured: Boolean(apiKey), provider, chatModel, embeddingModel, dimensions };
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}
