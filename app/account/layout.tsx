import AccountSidebar from "@/components/account/AccountSidebar";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <section className="flex flex-col gap-8">
      <h1>My account</h1>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
        <AccountSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}
