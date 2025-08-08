"use client";

import { trace } from "@opentelemetry/api";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    trace
      .getTracer("book-web-app")
      .startActiveSpan("global-error", async (span) => {
        span.recordException(error);
        span.end();
      });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
