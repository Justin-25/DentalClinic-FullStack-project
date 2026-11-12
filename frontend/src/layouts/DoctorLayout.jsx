import { NavLink, Outlet, ScrollRestoration, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import AccountMenu from "../components/AccountMenu";
import Logo from "../components/Logo";
import { navItem } from "./portalStyles";

const LINKS = [
  { to: "/doctor/appointments", label: "Appointments" },
  { to: "/doctor/schedule", label: "Schedule" },
  { to: "/doctor/profile", label: "Profile" },
];

// phone tabs: filled teal when active, outlined otherwise
const tab = ({ isActive }) =>
  `shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors duration-150 ease-soft ${isActive ? "bg-brand text-white" : "border border-gray-300 bg-white text-ink"}`;

export default function DoctorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/", { replace: true, flushSync: true });
    logout();
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ScrollRestoration />

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 md:h-18">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-semibold text-ink">
              Doctor portal
            </span>
          </div>
          <AccountMenu />
        </div>
      </header>

      <nav
        aria-label="Doctor portal"
        className="flex gap-2 overflow-x-auto px-5 pt-4 lg:hidden"
      >
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} className={tab}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-auto flex w-full max-w-6xl gap-12 px-5 py-6 md:py-12">
        <aside className="hidden w-60 shrink-0 space-y-1.5 lg:block">
          <div className="pb-3">
            <p className="text-xl font-bold text-ink">{user.name}</p>
            <p className="text-[13px] text-gray-500">{user.specialization}</p>
          </div>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navItem}>
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className={`${navItem({ isActive: false })} w-full text-left`}
          >
            Log out
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
