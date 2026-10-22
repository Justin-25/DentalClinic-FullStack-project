import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { useAuth } from "../../auth/AuthContext";
import TextField from "../../components/TextField";

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email))
    errors.email = "Please enter a valid email.";
  if (form.password.length < 8) errors.password = "Use at least 8 characters.";
  if (form.passwordConfirm !== form.password)
    errors.passwordConfirm = "Passwords don't match.";
  return errors;
}

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const signupM = useMutation({
    mutationFn: () => signup(form),
    onSuccess: () => navigate(redirectTo, { replace: true }),
  });

  if (user) return <Navigate to={redirectTo} replace />;

  const errors = validate(form);
  const showErrors = submitted;

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    signupM.mutate();
  }

  const isTaken = signupM.error?.code === "DUPLICATE_VALUE";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-105 space-y-4"
      noValidate
    >
      <h1 className="text-[32px] font-bold text-ink">Create your account</h1>
      <p className="text-[15px] text-gray-500">
        It takes a minute, and you can book right after.
      </p>

      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        value={form.name}
        onChange={handleChange}
        error={showErrors && errors.name}
        placeholder="Elena Reyes"
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={handleChange}
        error={showErrors && errors.email}
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={handleChange}
        error={showErrors && errors.password}
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm password"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        value={form.passwordConfirm}
        onChange={handleChange}
        error={showErrors && errors.passwordConfirm}
      />

      {signupM.error && (
        <p
          role="alert"
          className="flex items-start gap-2 py-3 rounded-lg border border-red-200 bg-red-50 px-3.5 text-[13px] font-medium text-red-800"
        >
          <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
          {isTaken ? (
            <span>
              That email is already registered.{" "}
              <Link to="/login" className="font-semibold underline">
                Log in instead
              </Link>
            </span>
          ) : (
            signupM.error.message
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={signupM.isPending}
        className="w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark disabled:opacity-60"
      >
        {signupM.isPending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-[13px] text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </form>
  );
}
