import { collectDefaultMetrics, register } from "prom-client";
import { NextResponse } from "next/server";

collectDefaultMetrics({ prefix: "book_web_app_" });

export async function GET() {
  return new NextResponse(await register.metrics(), {
    headers: {
      "Content-Type": register.contentType,
      "Cache-Control": "no-store",
    },
  });
}
