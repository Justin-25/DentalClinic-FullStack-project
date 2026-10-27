import { Outlet, ScrollRestoration } from "react-router";
import Header from "../components/Header";

export default function BookingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <ScrollRestoration />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
