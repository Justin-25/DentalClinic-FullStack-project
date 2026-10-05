import { Link, Outlet } from "react-router";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        {/* logo + <Link>s to Services, Doctor, Log in, Book now */}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer>{/* footer text for now */}</footer>
    </div>
  );
}
