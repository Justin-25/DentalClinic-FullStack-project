import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { useAuth } from "../../auth/AuthContext";
import { validatePasswords } from "../../utils/validation";
import TextField from "../../components/TextField";

export default function ResetPassword() {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    passwordConfirm: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const errors = validatePasswords(form);

  const resetM = useMutation({
    mutationFn: () => resetPassword(token, form),
    onSuccess: () => navigate("/", { replace: true }),
  });

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    resetM.mutate();
  }

  const expired = resetM.error?.code === "RESET_TOKEN_INVALID";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-105 space-y-4"
      noValidate
    >
      <h1 className="text-[32px] font-bold text-ink">Choose a new password</h1>

      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={handleChange}
        error={submitted && errors.password}
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm new password"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        value={form.passwordConfirm}
        onChange={handleChange}
        error={submitted && errors.passwordConfirm}
      />

      {resetM.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
        >
          <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
          {expired ? (
            <span>
              This link has expired or was already used.{" "}
              <Link to="/forgot-password" className="font-semibold underline">
                Send a new link
              </Link>
            </span>
          ) : (
            resetM.error.message
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={resetM.isPending}
        className="w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark disabled:opacity-60"
      >
        {resetM.isPending ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}
