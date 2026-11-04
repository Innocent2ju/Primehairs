import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin | Prime Hairs" };

export default function AdminPage() {
  return (
    <section>
      <h1>Admin</h1>
      <Suspense fallback={<p className="mt-6 text-light-gray/70">Checking access...</p>}>
        <AdminGreeting />
      </Suspense>
    </section>
  );
}

async function AdminGreeting() {
  const admin = await requireAdmin();

  return <p className="mt-6 text-light-gray">Signed in as admin: {admin.email}</p>;
}
