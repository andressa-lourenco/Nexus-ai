import "server-only";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error("[nexus] unexpected error", error);
  return NextResponse.json(
    { error: { code: "internal_error", message: "Something went wrong while processing the request." } },
    { status: 500 },
  );
}
