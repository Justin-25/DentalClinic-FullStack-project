import { useAuth } from "../auth/AuthContext";
import StaffLayout from "./StaffLayout";

const LINKS = [
  { to: "/doctor/appointments", label: "Appointments" },
  { to: "/doctor/schedule", label: "Schedule" },
  { to: "/doctor/profile", label: "Profile" },
];

export default function DoctorLayout() {
  const { user } = useAuth();

  return (
    <StaffLayout
      portal="Doctor portal"
      badge="Doctor portal"
      badgeClassName="bg-gray-100 text-ink"
      title={user.name}
      subtitle={user.specialization}
      links={LINKS}
    />
  );
}
