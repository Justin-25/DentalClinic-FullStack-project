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
import BookingLayout from "./layouts/BookingLayout";
import Book from "./pages/booking/Book";
import PortalLayout from "./layouts/PortalLayout";
import MyAppointments from "./pages/account/MyAppointments";
import AppointmentDetail from "./pages/account/AppointmentDetail";
import LeaveReview from "./pages/account/LeaveReview";
import AccountSettings from "./pages/account/AccountSettings";
import DoctorLayout from "./layouts/DoctorLayout";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorAppointmentDetail from "./pages/doctor/DoctorAppointmentDetail";

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
  {
    element: <BookingLayout />,
    children: [{ path: "book", element: <Book /> }],
  },
  {
    element: <RequireAuth roles={["patient"]} />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          {
            path: "account/appointments",
            element: <MyAppointments />,
          },
          {
            path: "account/appointments/:id",
            element: <AppointmentDetail />,
          },
          {
            path: "account/appointments/:id/review",
            element: <LeaveReview />,
          },
          {
            path: "account/settings",
            element: <AccountSettings />,
          },
        ],
      },
    ],
  },
  {
    element: <RequireAuth roles={["doctor"]} />,
    children: [
      {
        element: <DoctorLayout />,
        children: [
          {
            path: "doctor/appointments",
            element: <DoctorAppointments />,
          },
          {
            path: "doctor/appointments/:id",
            element: <DoctorAppointmentDetail />,
          },
          {
            path: "doctor/schedule",
            element: <Placeholder title="Schedule" />,
          },
          { path: "doctor/profile", element: <Placeholder title="Profile" /> },
        ],
      },
    ],
  },
]);
