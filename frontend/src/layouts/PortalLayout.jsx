import {
  NavLink,
  Link,
  Outlet,
  ScrollRestoration,
  useNavigate,
} from "react-router";
import Header from "../components/Header";
import { useAuth } from "../auth/AuthContext";
import { primaryBtn } from "../components/booking/buttonStyles";

const navItem = ({ isActive }) =>
  `flex h-9.5 items-center rounded-lg px-3 text-[15px] ${isActive ? "bg-gray-100 font-semibold text-ink" : "font-medium text-gray-500"}`;

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user.name.split(" ")[0];

  function handleLogout() {
    navigate("/", { replace: true, flushSync: true });
    logout();
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ScrollRestoration />
      <Header />
      <div className="mx-auto flex w-full max-w-6xl gap-12 px-5 py-8 md:py-12">
        <aside className="hidden w-60 shrink-0 space-y-1.5 lg:block">
          <div className="pb-3">
            <p className="text-xl font-bold text-ink">Hi, {firstName}</p>
            <p className="text-[13px] capitalize text-gray-500">{user.role}</p>
          </div>
          <NavLink to="/account/appointments" className={navItem}>
            My appointments
          </NavLink>
          <NavLink to="/account/settings" className={navItem}>
            Account settings
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className={navItem({ isActive: false }) + " w-full text-left"}
          >
            Log out
          </button>
          <div className="pt-3">
            <Link to="/book" className={primaryBtn}>
              Book an appointment
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
