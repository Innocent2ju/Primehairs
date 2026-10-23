import { getPostHogLogLogger, flushPostHogLogs } from "@/instrumentation";
import { auth } from "@/lib/auth";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { toNextJsHandler } from "better-auth/next-js";
import { after } from "next/server";

const handlers = toNextJsHandler(auth);

async function handleAuthRequest(request: Request, handler: () => Promise<Response>) {
  const logger = getPostHogLogLogger();

  logger?.emit({
    body: "Better Auth request received",
    severityNumber: SeverityNumber.INFO,
    attributes: {
      endpoint: "/api/auth/[...all]",
      method: request.method,
    },
  });

  try {
    const response = await handler();

    logger?.emit({
      body: "Better Auth request completed",
      severityNumber: SeverityNumber.INFO,
      attributes: {
        endpoint: "/api/auth/[...all]",
        method: request.method,
        status_code: response.status,
      },
    });

    return response;
  } catch (error) {
    logger?.emit({
      body: "Better Auth request failed",
      severityNumber: SeverityNumber.ERROR,
      attributes: {
        endpoint: "/api/auth/[...all]",
        method: request.method,
      },
    });

    throw error;
  } finally {
    after(async () => {
      await flushPostHogLogs();
    });
  }
}

export async function GET(request: Request) {
  return handleAuthRequest(request, () => handlers.GET(request));
}

export async function POST(request: Request) {
  return handleAuthRequest(request, () => handlers.POST(request));
}
