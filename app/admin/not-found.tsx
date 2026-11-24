import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold">
        Prime Hairs Admin
      </p>
      <h1 className="mt-4 font-playfair text-3xl font-bold">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-light-gray/70">
        The product, order or page may have been removed, or the link may be
        incorrect. Head back to the dashboard to continue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-300"
        >
          Back to dashboard
        </Link>
        <Link
          href="/admin/products"
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        >
          View products
        </Link>
      </div>
    </div>
  );
}
