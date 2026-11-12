// Sidebar link style shared by the patient and doctor portals.
export const navItem = ({ isActive }) =>
  `flex h-9.5 items-center rounded-lg px-3 text-[15px] ${isActive ? "bg-gray-100 font-semibold text-ink" : "font-medium text-gray-500"}`;
