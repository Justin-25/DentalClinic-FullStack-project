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
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },
]);
