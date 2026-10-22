import { Outlet, ScrollRestoration } from "react-router";
import Header from "../components/Header";
import authImg from "../assets/auth-dentist-patient.jpg";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollRestoration />
      <Header />
      <main className="grid flex-1 md:grid-cols-[43fr_57fr]">
        {/* LEFT: brand photo (desktop only) */}
        <aside className="hidden flex-col justify-center gap-6 bg-gray-100 p-14 md:flex">
          <img
            src={authImg}
            alt=""
            className="aspect-6/5 w-full rounded-2xl object-cover"
          />
          <h2 className="text-3xl font-bold text-ink">
            Gentle dental care for the whole family
          </h2>
          <p className="text-gray-500">
            Book in under a minute and manage every visit in one place.
          </p>
        </aside>
        <div className="flex items-center justify-center px-5 py-14">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
