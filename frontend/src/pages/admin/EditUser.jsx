import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeftLong, FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import Modal from "../../components/Modal";
import TextField from "../../components/TextField";
import { dangerBtn, primaryBtn, secondaryBtn } from "../../components/booking/buttonStyles";
import { FilterSelect } from "./adminUi";
import { DeactivatedTag } from "./UserTags";
import { ROLE_LABEL } from "./users";

const ROLE_OPTIONS = Object.entries(ROLE_LABEL);

// the account form: only mounted once the user has loaded, so its fields start from the saved values
function AccountForm({ user, isSelf }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [nameError, setNameError] = useState(null);

  const saveM = useMutation({
    mutationFn: () =>
      api(`/users/${user._id}`, {
        method: "PATCH",
        body: { name: name.trim(), email: email.trim(), ...(isSelf ? {} : { role }) },
      }),
    onSuccess: (res) => {
      setName(res.data.user.name);
      setEmail(res.data.user.email);
      // the page shows the saved user right away (the PATCH answer has no `active`, so keep it)
      queryClient.setQueryData(["users", user._id], (old) => ({
        ...old,
        data: { user: { ...old.data.user, ...res.data.user, active: old.data.user.active } },
      }));
      queryClient.invalidateQueries({ queryKey: ["users"], exact: true });
      // your own name or email changed: the header shows them
      if (isSelf) queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const changed = name !== user.name || email !== user.email || role !== user.role;

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Enter a name.");
      return;
    }
    saveM.mutate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="min-w-0 space-y-4 lg:flex-1 lg:rounded-xl lg:border lg:border-gray-300 lg:bg-white lg:p-6"
    >
      <h2 className="text-lg font-bold text-ink">Account</h2>
      <TextField
        label="Full name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError(null);
        }}
        error={nameError}
      />
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="space-y-1.5">
        <fieldset disabled={isSelf}>
          <FilterSelect label="Role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
        </fieldset>
        <p className="text-[12px] text-gray-500">
          {isSelf
            ? "This is your account, so you can't change your own role."
            : "Changing the role to Doctor lets them set a schedule and appear in “Our dentists”."}
        </p>
      </div>

      {saveM.isError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
        >
          <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
          {saveM.error.message}
        </p>
      )}

      <button type="submit" disabled={!changed || saveM.isPending} className={`${primaryBtn} lg:w-fit`}>
        {saveM.isPending ? "Saving..." : "Save changes"}
      </button>
      {saveM.isSuccess && !changed && (
        <p role="status" className="text-[13px] font-medium text-[#1E6B34]">
          Changes saved.
        </p>
      )}
    </form>
  );
}

// Deactivate (or bring back) an account, asking first in the Modal.
function ActivePanel({ user }) {
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);
  const deactivating = user.active !== false;

  const toggleM = useMutation({
    mutationFn: () =>
      deactivating
        ? api(`/users/${user._id}`, { method: "DELETE" })
        : api(`/users/${user._id}`, { method: "PATCH", body: { active: true } }),
    onSuccess: () => setAsking(false),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  function open() {
    toggleM.reset();
    setAsking(true);
  }
  function close() {
    if (!toggleM.isPending) setAsking(false);
  }

  const action = deactivating ? "Deactivate" : "Reactivate";

  return (
    <section className="w-full space-y-3 rounded-xl bg-gray-100 p-5 lg:w-85 lg:shrink-0">
      <h2 className="text-base font-bold text-ink">{deactivating ? "Deactivate account" : "Account deactivated"}</h2>
      <p className="text-[13px] text-gray-500">
        {deactivating
          ? "They can no longer log in. Their appointments and reviews stay in the records."
          : "They can't log in right now. Reactivating lets them log in again."}
      </p>
      <button type="button" onClick={open} className={secondaryBtn}>
        {action} user
      </button>

      <Modal
        open={asking}
        tone={toggleM.isError ? "error" : undefined}
        title={toggleM.isError ? `We couldn't ${action.toLowerCase()} this account` : `${action} ${user.name}?`}
        onClose={close}
        actions={
          toggleM.isError ? (
            <button type="button" onClick={close} className={secondaryBtn}>
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={close}
                disabled={toggleM.isPending}
                className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => toggleM.mutate()}
                disabled={toggleM.isPending}
                className={deactivating ? dangerBtn : primaryBtn}
              >
                {toggleM.isPending ? "Saving..." : action}
              </button>
            </>
          )
        }
      >
        {toggleM.isError
          ? toggleM.error.message
          : deactivating
            ? "They won't be able to log in. You can reactivate the account later."
            : "They'll be able to log in again."}
      </Modal>
    </section>
  );
}

export default function EditUser() {
  const { userId } = useParams();
  const { user: me } = useAuth();

  const userQ = useQuery({
    queryKey: ["users", userId],
    queryFn: () => api(`/users/${userId}`),
  });

  if (userQ.isPending) return <p className="text-sm text-gray-500">Loading user...</p>;
  if (userQ.isError) return <p className="text-sm text-gray-500">We couldn't find this user.</p>;

  const user = userQ.data.data.user;
  const isSelf = user._id === me._id;

  return (
    <div className="space-y-5">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand md:text-sm"
      >
        <FaArrowLeftLong aria-hidden="true" /> Users
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink md:text-[32px]">{user.name}</h1>
        {user.active === false && <DeactivatedTag />}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        {/* key: a fresh form for each user (the fields start from the saved values) */}
        <AccountForm key={user._id} user={user} isSelf={isSelf} />
        {!isSelf && <ActivePanel user={user} />}
      </div>
    </div>
  );
}
