import { Suspense } from "react";
import Link from "next/link";
import CartDropdown from "./CartDropdown";
import NavbarSearch from "./NavbarSearch";
import AccountNav from "./auth/AccountNav";

const Navbar = () => {
  return (
    <header>
      <nav>
        <Link href="/" className="logo">
          {/* <Image src="/icons/logo.png" alt="logo" width={24} height={24} /> */}

          <p>Prime Hairs</p>
        </Link>

        <ul>
          <Link href="/">Home</Link>
          <Link href="/products">Shop</Link>
          <li>
            <NavbarSearch />
          </li>
          <li>
            <CartDropdown />
          </li>
          <li>
            <Suspense>
              <AccountNav />
            </Suspense>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
