import { Outlet, ScrollRestoration } from "react-router";
import Header from "../components/Header";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollRestoration />
      <Header />
      <main className="flex flex-1">
        <Outlet />
      </main>
    </div>
  );
}
