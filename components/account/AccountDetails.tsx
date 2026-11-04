import type { ReactNode } from "react";
import { formatMemberSince, getInitials } from "@/lib/account";
import { requireUser } from "@/lib/session";

const cardClass = "rounded-2xl border border-white/10 bg-[#161616] p-6 sm:p-8";

/** Reads the session, so it must be rendered inside a <Suspense> boundary. */
export default async function AccountDetails() {
  const user = await requireUser();

  return (
    <article className={cardClass}>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex-center h-14 w-14 shrink-0 rounded-full border border-gold/30 bg-black text-lg font-semibold text-gold"
        >
          {getInitials(user.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-2xl">{user.name}</h2>
          <p className="text-sm text-light-gray/70">
            Member since {formatMemberSince(user.createdAt)}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
        <DetailItem label="Name">{user.name}</DetailItem>
        <DetailItem label="Email">{user.email}</DetailItem>
        <DetailItem label="Email status">
          <EmailStatus isVerified={user.emailVerified} />
        </DetailItem>
      </dl>
    </article>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-light-gray/60">{label}</dt>
      <dd className="mt-1 break-words text-white">{children}</dd>
    </div>
  );
}

function EmailStatus({ isVerified }: { isVerified: boolean }) {
  if (isVerified) return <span className="pill">Verified</span>;

  return (
    <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium text-light-gray/70 sm:px-3 sm:py-1 sm:text-xs">
      Not verified
    </span>
  );
}

export function AccountDetailsSkeleton() {
  return (
    <div className={cardClass} aria-busy="true">
      <span className="sr-only">Loading your account...</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-white/10" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 rounded bg-white/10" />
            <div className="h-4 w-28 rounded bg-white/10" />
          </div>
        </div>
        <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex flex-col gap-2">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="h-5 w-44 max-w-full rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
