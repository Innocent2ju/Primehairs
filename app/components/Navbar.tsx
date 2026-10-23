import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-muted/10">
      <nav className="container-site h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-accent">
          PrimeHairs
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/products" className="link-nav">
            Shop
          </Link>
          <Link href="/cart" className="link-nav">
            Cart
          </Link>
        </div>
      </nav>
    </header>
  );
}
