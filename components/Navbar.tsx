"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import CartDropdown from "@/components/CartDropdown";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/context/cart-context";

const Navbar = () => {
  const { isOpen, toggleCart, totalItems } = useCart();
  const { data: session } = authClient.useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <header>
      <nav>
        <Link href="/" className="logo">
          <p>Prime Hairs</p>
        </Link>

        <div className="flex items-center gap-6">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/products">Shop</Link>
            </li>
            <li>
              {isSignedIn ? (
                <Link href="/my-profile">Profile</Link>
              ) : (
                <Link href="/sign-in">Sign In</Link>
              )}
            </li>
          </ul>

          <div className="relative">
            <button
              type="button"
              data-cart-trigger="true"
              onClick={toggleCart}
              aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
              aria-expanded={isOpen}
              className="relative flex size-10 cursor-pointer items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:bg-gold/10"
            >
              <ShoppingBag className="size-5" aria-hidden="true" />

              {totalItems > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold leading-5 text-black">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              ) : null}
            </button>

            <CartDropdown />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
