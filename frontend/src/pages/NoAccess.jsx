import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext";

const HOME = {
  patient: "/account/appointments",
  doctor: "/doctor/appointments",
  admin: "/admin/appointments",
};

export default function NoAccess() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-[32px] font-bold text-ink">
        You don't have access to this page
      </h1>
      <p className="mt-3 text-gray-500">
        This page is for a different kind of account. If you think this is a
        mistake, contact the clinic.
      </p>
      <Link
        to={HOME[user.role]}
        className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark"
      >
        Go to my dashboard
      </Link>
    </section>
  );
}
