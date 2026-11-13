import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import {
  primaryBtn,
  secondaryBtn,
} from "../../components/booking/buttonStyles";
import { CONFIRM_TITLE } from "./doctorActions";

export function useStatusChange() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(null);

  function openConfirm(appointment, action) {
    statusM.reset();
    setConfirming({ appointment, action });
  }

  function closeConfirm() {
    if (!statusM.isPending) setConfirming(null);
  }

  function handleConfirm() {
    statusM.mutate(
      { id: confirming.appointment._id, status: confirming.action.status },
      { onSuccess: () => setConfirming(null) },
    );
  }

  const statusM = useMutation({
    mutationFn: ({ id, status }) =>
      api(`/appointments/${id}/status`, {
        method: "PATCH",
        body: {
          status,
        },
      }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const modal = (
    <Modal
      open={!!confirming}
      tone={statusM.isError ? "error" : undefined}
      title={
        statusM.isError
          ? "We couldn't update this appointment"
          : confirming &&
            CONFIRM_TITLE[confirming.action.status]?.(
              confirming.appointment.patient?.name ?? "the patient",
            )
      }
      onClose={closeConfirm}
      actions={
        statusM.isError ? (
          <button type="button" onClick={closeConfirm} className={secondaryBtn}>
            Close
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={closeConfirm}
              disabled={statusM.isPending}
              className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={statusM.isPending}
              className={primaryBtn}
            >
              {statusM.isPending ? "Saving..." : confirming?.action.label}
            </button>
          </>
        )
      }
    >
      {statusM.isError ? statusM.error.message : "This can't be undone."}
    </Modal>
  );

  return { openConfirm, modal };
}
