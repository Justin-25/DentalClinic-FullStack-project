import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { useAuth } from "../../../auth/AuthContext";
import { validatePasswords } from "../../../utils/validation";
import TextField from "../../../components/TextField";
import { secondaryBtn } from "../../../components/booking/buttonStyles";

const EMPTY = {
  currentPassword: "",
  password: "",
  passwordConfirm: "",
};

export default function PasswordForm() {
  const { updatePassword } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  const passwordM = useMutation({
    mutationFn: () => updatePassword(form),
    onSuccess: () => {
      setForm(EMPTY);
      setSubmitted(false);
    },
  });

  // derived: your validator plus one extra rule
  const errors = validatePasswords(form);
  if (!form.currentPassword)
    errors.currentPassword = "Enter your current password.";

  // the server's "wrong password" belongs under the field it's about
  const wrongCurrent = passwordM.error?.code === "INCORRECT_PASSWORD";

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (passwordM.isSuccess || passwordM.isError) passwordM.reset();
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    passwordM.mutate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 lg:rounded-xl lg:border lg:border-gray-300 lg:bg-white lg:p-6"
    >
      <h2 className="text-lg font-bold text-ink lg:text-xl">Password</h2>

      <TextField
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={form.currentPassword}
        onChange={handleChange}
        error={
          (submitted && errors.currentPassword) ||
          (wrongCurrent && passwordM.error.message)
        }
      />
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={form.password}
        onChange={handleChange}
        error={submitted && errors.password}
      />
      <TextField
        label="Confirm new password"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        value={form.passwordConfirm}
        onChange={handleChange}
        error={submitted && errors.passwordConfirm}
      />

      {passwordM.error && !wrongCurrent && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
        >
          <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
          {passwordM.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={passwordM.isPending}
        className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60 lg:w-fit`}
      >
        {passwordM.isPending ? "Updating..." : "Update password"}
      </button>

      {passwordM.isSuccess && (
        <p role="status" className="text-[13px] font-medium text-[#1E6B34]">
          Password updated.
        </p>
      )}
    </form>
  );
}
