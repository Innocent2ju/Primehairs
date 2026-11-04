import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] p-6 sm:p-8">
      {children}
    </section>
  );
}
