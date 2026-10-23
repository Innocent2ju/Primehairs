# PostHog error tracking

> ⚠️ **Needs your attention**
> - Configure the external CI/hosting provider that runs `npm run build` with `POSTHOG_API_KEY` as a protected/masked secret, plus `POSTHOG_PROJECT_ID` and `POSTHOG_HOST` as build variables. Set `POSTHOG_HOST` to the EU PostHog host.
> - Configure the external provider's build/runtime settings with `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` so browser and server runtime instrumentation are available; only `POSTHOG_API_KEY` is secret.
> - The repository has no traceable deploy pipeline, so identify the provider and ensure its build exposes a resolvable git release identity. If a Docker build is introduced, forward git variables into the build stage and use a build-secret mechanism for `POSTHOG_API_KEY`.
> - Fix the existing `/products/[slug]` blocking-prerender failure before treating the overall production build as green; it is unrelated to the PostHog changes.

## What you still need to do

1. The personal source-map API key is already stored locally in `.env.local`, so no new key is needed for local builds. For production, create or use the provider's protected/masked secret named `POSTHOG_API_KEY` and add build variables named `POSTHOG_PROJECT_ID` and `POSTHOG_HOST` in the CI/hosting provider's settings. Use project ID `317544` and the EU PostHog host there.
2. Configure the same provider's build and runtime settings with `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`. The build needs the browser variables embedded, and `npm run start` needs them for server instrumentation.
3. Because no CI workflow, Dockerfile, or deployment manifest exists in this repository, connect these settings to the external deployment path that actually runs `npm run build` and `npm run start`. Preserve a resolvable git identity for release creation; do not put the API key in source or a Docker `ARG`/`ENV`.
4. Resolve the pre-existing `/products/[slug]` blocking-prerender error and rerun `npm run build` in the deployment environment. The PostHog upload hook itself completed successfully during verification, but the overall command exited 1 during static generation.

## What is working now

Uncaught browser errors are captured by `posthog-js` through the existing `capture_exceptions: true` initialization in `instrumentation-client.ts`. Root App Router rendering errors are reported by `app/global-error.tsx`. Node.js errors are captured through the guarded `posthog-node` singleton and Next.js's typed `onRequestError` hook in `instrumentation.ts`, which flushes the event immediately. The Node setup also enables exception autocapture. The app now has both browser and server PostHog error tracking initialized; `posthog-node` was added to `package.json` and `package-lock.json`.

Source-map upload is wired through `next.config.ts` using `@posthog/nextjs-config`. The changed files are:

- `next.config.ts`
- `package.json`
- `package-lock.json`
- `.env.local`
- `.env.example`

The production build command is `npm run build`. Every production build is configured to upload source maps when `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, and `POSTHOG_HOST` are available where the build runs; without them, the upload is skipped. Uploaded maps are deleted from the deployed artifact. The local credentials contract is `.env.local`; `.env.example` documents placeholder names only.

Verification ran `npm install` successfully and then `npm run build`. Compilation, TypeScript, and the PostHog upload hook passed. The uploader resolved release `Primehairs@92f5efce8af3c19631394882da9f3a1db9502027`; 0 new chunks were uploaded because 55 relevant chunks were already present from the earlier initial upload of 101 chunks. The overall build exited 1 only during the existing `/products/[slug]` static-generation failure, with unrelated Better Auth warnings also present.

Release linking was not wired because no deploy path could be followed in the repository. Local runs, tests, and pull-request builds therefore have no release ID added by this setup. A future production deployment should preserve a resolvable git identity so the source-map integration can create and associate the release; the runtime currently does not receive a release ID from a linked deploy configuration.

## How to verify

Trigger an error and inspect [PostHog Error Tracking](https://eu.posthog.com/project/317544/error_tracking). Uploaded symbol sets appear at [Error Tracking configuration](https://eu.posthog.com/project/317544/error_tracking/configuration). After fixing the production build and configuring the external provider, verify that a production exception has a readable, symbolicated stack trace and that the corresponding uploaded symbol set is visible in configuration.
