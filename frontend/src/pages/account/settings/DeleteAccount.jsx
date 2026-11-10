import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { useAuth } from "../../../auth/AuthContext";
import Modal from "../../../components/Modal";
import {
  dangerBtn,
  secondaryBtn,
} from "../../../components/booking/buttonStyles";

export default function DeleteAccount() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteM = useMutation({
    mutationFn: () =>
      api("/users/myAccount", {
        method: "DELETE",
      }),
    onSuccess: () => {
      navigate("/", { replace: true, flushSync: true });
      logout();
    },
  });

  function closeConfirm() {
    if (deleteM.isPending) return;
    setConfirmOpen(false);
    deleteM.reset();
  }

  return (
    <section className="space-y-3.5 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:space-y-0 lg:rounded-xl lg:bg-gray-100 lg:p-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-ink">Delete account</h2>
        <p className="text-[13px] text-gray-500 md:text-sm">
          Your past appointments are kept for clinic records. You can't undo
          this.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={`${secondaryBtn} lg:w-fit lg:shrink-0`}
      >
        Delete my account
      </button>

      <Modal
        open={confirmOpen}
        tone={deleteM.error ? "error" : undefined}
        title={
          deleteM.error
            ? "We couldn't delete your account"
            : "Delete your account?"
        }
        onClose={closeConfirm}
        actions={
          deleteM.error ? (
            <button
              type="button"
              onClick={closeConfirm}
              className={secondaryBtn}
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={closeConfirm}
                disabled={deleteM.isPending}
                className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Keep my account
              </button>
              <button
                type="button"
                onClick={() => deleteM.mutate()}
                disabled={deleteM.isPending}
                className={dangerBtn}
              >
                {deleteM.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </>
          )
        }
      >
        {deleteM.error
          ? deleteM.error.message
          : "You'll be logged out right away. Your past appointments stay with the clinic. You can't undo this."}
      </Modal>
    </section>
  );
}
