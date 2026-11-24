import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

import AdminHeader from "@/components/admin/Header";
import AdminSidebar from "@/components/admin/Sidebar";
import { AdminToastProvider } from "@/components/admin/AdminToast";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Every admin request is authorised here: unauthenticated visitors are
// redirected to /sign-in and signed-in non-admins get a 404.
const AdminShell = async ({ children }: { children: React.ReactNode }) => {
  // Wait for the real request before touching cookies: during prerendering
  // there is no session to read.
  await connection();

  const { admin } = await requireAdminPage();

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-black text-white md:flex">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader admin={admin} />

          <div className="flex-1 bg-black px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </div>
      </div>
    </AdminToastProvider>
  );
};

const AdminLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-black">
    <p className="animate-pulse text-sm uppercase tracking-[0.3em] text-gold">
      Loading admin…
    </p>
  </div>
);

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // The session read happens inside the boundary, so the route still has a
  // static shell while Neon Auth resolves on each request.
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
