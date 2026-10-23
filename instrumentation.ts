import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import type { Instrumentation } from "next";
import type { PostHog } from "posthog-node";

let loggerProvider: LoggerProvider | undefined;
let postHogClient: PostHog | undefined;

function getPostHogLogConfiguration() {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
      );
    }

    return;
  }

  if (!host) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured"
      );
    }

    return;
  }

  return { projectToken, host };
}

async function getPostHogServer() {
  if (postHogClient) {
    return postHogClient;
  }

  const configuration = getPostHogLogConfiguration();

  if (!configuration) {
    return;
  }

  const { PostHog } = await import("posthog-node");
  postHogClient = new PostHog(configuration.projectToken, {
    host: configuration.host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });

  return postHogClient;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const configuration = getPostHogLogConfiguration();

  if (!configuration) {
    return;
  }

  if (!loggerProvider) {
    loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({ "service.name": "primehairs" }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${configuration.host.replace(/\/$/, "")}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${configuration.projectToken}`,
              "Content-Type": "application/json",
            },
          }),
        }),
      ],
    });
  }

  await getPostHogServer();
}

export const onRequestError: Instrumentation.onRequestError = async (error) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const posthog = await getPostHogServer();

  if (!posthog) {
    return;
  }

  posthog.captureException(error);
  await posthog.flush();
};

export function getPostHogLogLogger() {
  return loggerProvider?.getLogger("primehairs-posthog");
}

export async function flushPostHogLogs() {
  await loggerProvider?.forceFlush();
}
