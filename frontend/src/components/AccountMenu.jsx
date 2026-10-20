import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FaChevronDown } from "react-icons/fa6";
import { useAuth } from "../auth/AuthContext";

const PORTAL = {
  patient: {
    to: "/account/appointments",
    label: "My appointments",
  },
  doctor: {
    to: "/doctor/appointments",
    label: "Doctor portal",
  },
  admin: {
    to: "/admin/appointments",
    label: "Admin portal",
  },
};

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const firstName = user.name.replace(/^Dr\.\s*/, "").split(" ")[0];
  const portal = PORTAL[user.role];

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-gray-300 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink transition-colors duration-150 ease-soft hover:border-brand"
      >
        <img
          src={`/img/users/${user.photo}`}
          alt=""
          className="size-7 rounded-full object-cover"
        />
        {firstName}
        <FaChevronDown
          aria-hidden="true"
          className={`text-[10px] text-gray-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-full z-20 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-2 shadow-lg transition-[opacity,transform,visibility] duration-150 ease-soft motion-reduce:transition-none ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-[12px] text-gray-500">{user.email}</p>
        </div>
        <Link
          role="menuitem"
          to={portal.to}
          onClick={() => setOpen(false)}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-gray-100"
        >
          {portal.label}
        </Link>
        <Link
          role="menuitem"
          to="/account/settings"
          onClick={() => setOpen(false)}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-gray-100"
        >
          Account settings
        </Link>
        <button
          role="menuitem"
          type="button"
          onClick={handleLogout}
          className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-gray-100"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
