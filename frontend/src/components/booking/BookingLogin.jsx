import { useState } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { useAuth } from "../../auth/AuthContext";
import { LOGIN_MESSAGES } from "../../auth/loginMessages";
import TextField from "../TextField";
import { primaryBtn, secondaryBtn } from "./buttonStyles";

// step 4 for guests: log in without leaving the page.
// On success the ['me'] cache fills, `user` appears in Book, and it re-renders as the confirm step.
export default function BookingLogin({ summary, when, signupHref }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginM = useMutation({ mutationFn: () => login(email, password) });

  function handleSubmit(e) {
    e.preventDefault();
    loginM.mutate();
  }

  const errorMessage =
    loginM.error &&
    (LOGIN_MESSAGES[loginM.error.code] ?? loginM.error.message);

  return (
    <section className="max-w-110 space-y-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-ink md:text-[32px]">
          Log in to book
        </h1>
        <p className="text-sm text-gray-500 md:text-[15px]">
          Your time is saved. Log in or create an account to finish booking.
        </p>
      </div>

      {/* mobile only: the summary panel shows this on desktop */}
      <div className="space-y-1 rounded-xl bg-gray-100 p-3.5 lg:hidden">
        <p className="text-sm font-semibold text-ink">{summary}</p>
        <p className="text-[13px] text-gray-500">{when}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          className="inline-block text-[13px] font-semibold text-brand md:text-sm"
        >
          Forgot password?
        </Link>

        {errorMessage && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
          >
            <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
            {errorMessage}
          </p>
        )}

        <button type="submit" disabled={loginM.isPending} className={primaryBtn}>
          {loginM.isPending ? "Logging in..." : "Log in & continue"}
        </button>
      </form>

      <p className="text-center text-[13px] text-gray-500 md:text-sm">
        New to Tooth Fairy?
      </p>
      <Link to={signupHref} className={secondaryBtn}>
        Create an account
      </Link>
    </section>
  );
}
