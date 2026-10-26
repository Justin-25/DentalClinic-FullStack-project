import { createBrowserRouter } from "react-router";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/public/Home";
import Services from "./pages/public/Services";
import ServiceDetail from "./pages/public/ServiceDetail";
import Doctors from "./pages/public/Doctors";
import DoctorProfile from "./pages/public/DoctorProfile";
import Reviews from "./pages/public/Reviews";
import NotFound from "./pages/public/NotFound";
import Login from "./pages/auth/Login";
import AuthLayout from "./layouts/AuthLayout";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RequireAuth from "./pages/auth/RequireAuth";
import Placeholder from "./pages/Placeholder";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "services", element: <Services /> },
      { path: "services/:slug", element: <ServiceDetail /> },
      { path: "doctors", element: <Doctors /> },
      { path: "doctors/:doctorId", element: <DoctorProfile /> },
      { path: "reviews", element: <Reviews /> },
      {
        element: <RequireAuth roles={["patient"]} />,
        children: [
          {
            path: "account/appointments",
            element: <Placeholder title="My appointments" />,
          },
          {
            path: "account/settings",
            element: <Placeholder title="Account settings" />,
          },
        ],
      },
      {
        element: <RequireAuth roles={["doctor"]} />,
        children: [
          {
            path: "doctor/appointments",
            element: <Placeholder title="Doctor portal" />,
          },
        ],
      },
      {
        element: <RequireAuth roles={["admin"]} />,
        children: [
          {
            path: "admin/appointments",
            element: <Placeholder title="Admin portal" />,
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password/:token", element: <ResetPassword /> },
    ],
  },
]);
