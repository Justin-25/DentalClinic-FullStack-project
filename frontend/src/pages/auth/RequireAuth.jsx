import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import NoAccess from "../../pages/NoAccess";

export default function RequireAuth({ roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p className="p-10 text-gray-500">Checking your session...</p>;
  }

  if (!user) {
    const here = location.pathname + location.search;
    return (
      <Navigate to={`/login?redirect=${encodeURIComponent(here)}`} replace />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <NoAccess />;
  }

  return <Outlet />;
}
