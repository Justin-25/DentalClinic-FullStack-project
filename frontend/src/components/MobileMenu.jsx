import { useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { FaChevronRight, FaXmark } from "react-icons/fa6";
import { useAuth } from "../auth/AuthContext";
import { PORTAL } from "../auth/portals";
import Logo from "./Logo";
import { primaryBtn, secondaryBtn } from "./booking/buttonStyles";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Our dentists" },
  { to: "/reviews", label: "Reviews" },
];

export default function MobileMenu({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const links = user
    ? [
        ...PUBLIC_LINKS,
        {
          to: PORTAL[user.role].to,
          label: PORTAL[user.role].label,
        },
        { to: "/account/settings", label: "Account settings" },
      ]
    : PUBLIC_LINKS;

  function handleClick(e) {
    if (e.target.closest("a")) onClose();
  }

  function handleLogout() {
    onClose();
    logout();
    navigate("/", { replace: true });
  }

  return (
    <dialog
      ref={ref}
      aria-label="Menu"
      onCancel={(e) => {
        e.preventDefault();
        logout();
      }}
      className="modal m-0 h-dvh max-h-none w-full max-w-none bg-white md:hidden"
    >
      <div onClick={handleClick} className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-5">
          <Logo />
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-ink"
          >
            <FaXmark aria-hidden="true" /> Close
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5">
          <ul>
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center justify-between border-b border-gray-200 py-4 text-[17px] font-semibold ${isActive ? "text-brand" : "text-ink"}`
                  }
                >
                  {link.label}
                  <FaChevronRight
                    aria-hidden="true"
                    className="text-xs text-gray-400"
                  />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 space-y-2.5 px-5 pb-6 pt-4">
          {user && (
            <div className="flex items-center gap-3 pb-1.5">
              <img
                src={`/img/users/${user.photo}`}
                alt=""
                className="size-9 rounded-full bg-gray-200 object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-ink">{user.name}</p>
                <p className="text-[12px] capitalize text-gray-500">
                  {user.role}
                </p>
              </div>
            </div>
          )}

          <Link to="/book" className={primaryBtn}>
            Book an appointment
          </Link>
        </div>
      </div>
    </dialog>
  );
}
