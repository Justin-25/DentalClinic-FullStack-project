import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import { dangerBtn, primaryBtn, secondaryBtn } from "../../components/booking/buttonStyles";
import { STATUS_LABEL, refreshAfterStatusChange } from "./adminActions";
import { textLink } from "./adminUi";

// The backend lets admins set any status, so a mistake (a wrong no-show, a cancel by
// accident) can be fixed here. The normal next steps stay in the "Update status" panel.
export default function CorrectStatus({ appointment, name }) {
  const queryClient = useQueryClient();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null); // the chosen new status
  const [reason, setReason] = useState("");

  const correctM = useMutation({
    mutationFn: () =>
      api(`/appointments/${appointment._id}/status`, {
        method: "PATCH",
        body: {
          status,
          ...(status === "cancelled" && reason.trim() ? { cancellationReason: reason.trim() } : {}),
        },
      }),
    onSuccess: () => setOpen(false),
    onSettled: () => refreshAfterStatusChange(queryClient),
  });

  function openModal() {
    correctM.reset();
    setStatus(null);
    setReason("");
    setOpen(true);
  }
  function close() {
    if (!correctM.isPending) setOpen(false);
  }

  const choices = Object.keys(STATUS_LABEL).filter((s) => s !== appointment.status);

  return (
    <>
      <button type="button" onClick={openModal} className={textLink}>
        Correct status…
      </button>

      <Modal
        open={open}
        tone={correctM.isError ? "error" : undefined}
        title={correctM.isError ? "We couldn't update this appointment" : `Correct ${name}'s status`}
        onClose={close}
        actions={
          correctM.isError ? (
            <button type="button" onClick={close} className={secondaryBtn}>
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={close}
                disabled={correctM.isPending}
                className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => correctM.mutate()}
                disabled={!status || correctM.isPending}
                className={status === "cancelled" ? dangerBtn : primaryBtn}
              >
                {correctM.isPending ? "Saving..." : "Save"}
              </button>
            </>
          )
        }
      >
        {correctM.isError ? (
          // un-cancelling a slot that was booked again hits the backend's unique index
          correctM.error.code === "DUPLICATE_VALUE"
            ? "Another patient has booked this time since it was cancelled, so it can't be restored."
            : correctM.error.message
        ) : (
          <div className="space-y-3">
            <p>
              Use this only to fix a mistake. It's {STATUS_LABEL[appointment.status].toLowerCase()} now.
            </p>
            <fieldset className="space-y-2">
              <legend className="mb-1.5 text-[13px] font-medium text-ink">New status</legend>
              {choices.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
                  <input
                    type="radio"
                    name={`${id}-status`}
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="size-4 accent-brand"
                  />
                  {STATUS_LABEL[s]}
                </label>
              ))}
            </fieldset>
            {status === "cancelled" && (
              <div className="space-y-1.5">
                <label htmlFor={`${id}-reason`} className="block text-[13px] font-medium text-ink">
                  Reason (optional)
                </label>
                <textarea
                  id={`${id}-reason`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. The dentist is unavailable"
                  className="h-20 w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
