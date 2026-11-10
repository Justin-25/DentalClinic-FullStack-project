import { useState } from "react";
import { Link, NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext";
import AccountMenu from "./AccountMenu";
import MobileMenu from "./MobileMenu";
import Logo from "./Logo";

export default function Header() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navClass = ({ isActive }) =>
    isActive
      ? "font-bold underline underline-offset-3 decoration-2 decoration-brand-logo"
      : "text-gray-600 transition-colors duration-150 ease-soft hover:text-ink";

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:h-18">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/services" className={navClass}>
            Services
          </NavLink>
          <NavLink to="/doctors" className={navClass}>
            Doctors
          </NavLink>
          <NavLink to="/reviews" className={navClass}>
            Reviews
          </NavLink>
          {!user && (
            <NavLink to="/login" className={navClass}>
              Log in
            </NavLink>
          )}
          <Link
            to="/book"
            className="rounded-full bg-brand px-4.5 py-2.5 font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark motion-safe:hover:-translate-y-0.5"
          >
            Book now
          </Link>
          {user && <AccountMenu />}
        </nav>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className="text-[15px] font-semibold text-ink md:hidden"
        >
          Menu
        </button>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
