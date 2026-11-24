import Link from "next/link";

const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]"
      />

      <Link
        href="/"
        className="absolute left-1/2 top-8 -translate-x-1/2 font-playfair text-xl font-bold italic tracking-wide text-gold"
      >
        Prime Hairs
      </Link>

      {children}

      <p className="mt-10 text-xs text-light-gray/60">
        &copy; Prime Hairs. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;
