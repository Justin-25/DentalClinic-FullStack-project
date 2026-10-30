import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { FaCircleExclamation } from "react-icons/fa6";
import TextField from "../../components/TextField";
import { LOGIN_MESSAGES } from "../../auth/loginMessages";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginM = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () =>
      navigate(redirectTo, {
        replace: true,
      }),
  });

  if (user) return <Navigate to={redirectTo} replace />;

  function handleSubmit(e) {
    e.preventDefault();
    loginM.mutate();
  }

  const errorMessage =
    loginM.error && (LOGIN_MESSAGES[loginM.error.code] ?? loginM.error.message);

  return (
    <div className="flex items-center justify-center px-5 py-14">
      {/* RIGHT: the form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-105 space-y-4"
        noValidate
      >
        <h1 className="text-3xl font-bold text-ink">Welcome back</h1>
        <p className="text-gray-500">
          Log in to book and manage your appointments.
        </p>

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Link
          to="/forgot-password"
          className="inline-block text-[13px] font-semibold text-brand"
        >
          Forgot password?
        </Link>

        {errorMessage && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
          >
            <FaCircleExclamation
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loginM.isPending}
          className="w-full rounded-full bg-brand py-3 font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark disabled:opacity-60"
        >
          {loginM.isPending ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-[13px] text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-brand">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
