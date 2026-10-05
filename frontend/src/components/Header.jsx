import { Link, NavLink } from "react-router";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-8">
          <NavLink
            to="/services"
            className={({ isActive }) =>
              isActive
                ? "font-bold underline underline-offset-3 decoration-2 decoration-brand-logo"
                : "font-normal"
            }
          >
            Services
          </NavLink>
          <NavLink
            to="/doctors"
            className={({ isActive }) =>
              isActive
                ? "font-bold underline underline-offset-4 decoration-2 decoration-brand-logo"
                : "font-normal"
            }
          >
            Doctors
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive
                ? "font-bold underline underline-offset-4 decoration-2 decoration-brand-logo"
                : "font-normal"
            }
          >
            Login
          </NavLink>
          <Link
            to="/book"
            className="rounded-full bg-brand px-4.5 py-2.5 font-semibold text-white"
          >
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
