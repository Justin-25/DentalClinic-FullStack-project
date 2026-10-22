import { useState } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../api/client";
import TextField from "../../components/TextField";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailError = !/^\S+@\S+\.\S+$/.test(email)
    ? "Please enter a valid email."
    : null;

  const forgotM = useMutation({
    mutationFn: () =>
      api("/users/forgotPassword", {
        method: "POST",
        body: {
          email,
        },
      }),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (emailError) return;
    forgotM.mutate();
  }

  if (forgotM.isSuccess) {
    return (
      <div className="w-full max-w-105 space-y-4">
        <h1 className="text-[32px] font-bold text-ink">Check your email</h1>
        <p className="text-[15px] text-gray-500">
          If an account exists for{" "}
          <span className="font-semibold text-ink">{email}</span>, a reset link
          is on its way. It expires in 10 minutes.
        </p>
        <Link
          to="/login"
          className="inline-block text-sm font-semibold text-brand"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-105 space-y-4"
      noValidate
    >
      <h1 className="text-[32px] font-bold text-ink">Reset your password</h1>
      <p className="text-[15px] text-gray-500">
        Enter your email and we'll send you a reset link.
      </p>

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={submitted && emailError}
        placeholder="you@example.com"
      />

      {forgotM.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
        >
          <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
          {forgotM.error.code === "RATE_LIMITED"
            ? "Too many requests. Please try again later."
            : forgotM.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={forgotM.isPending}
        className="w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark disabled:opacity-60"
      >
        {forgotM.isPending ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-center text-[13px] text-gray-500">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
