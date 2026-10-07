import { Link, NavLink } from "react-router";
import Logo from "./Logo";

export default function Header() {
  const navClass = ({ isActive }) =>
    isActive
      ? "font-bold underline underline-offset-3 decoration-2 decoration-brand-logo"
      : "text-gray-600 transition-colors duration-150 ease-soft hover:text-ink";

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-8">
          <NavLink to="/services" className={navClass}>
            Services
          </NavLink>
          <NavLink to="/doctors" className={navClass}>
            Doctors
          </NavLink>
          <NavLink to="/login" className={navClass}>
            Login
          </NavLink>
          <Link
            to="/book"
            className="rounded-full bg-brand px-4.5 py-2.5 font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark motion-safe:hover:-translate-y-0.5"
          >
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
