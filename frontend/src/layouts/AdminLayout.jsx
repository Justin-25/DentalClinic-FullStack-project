import StaffLayout from "./StaffLayout";

const LINKS = [
  { to: "/admin/appointments", label: "Appointments" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/reviews", label: "Reviews" },
];

export default function AdminLayout() {
  return (
    <StaffLayout
      portal="Admin portal"
      badge="Admin"
      badgeClassName="bg-brand text-white"
      title="Admin"
      subtitle="Clinic management"
      links={LINKS}
    />
  );
}
