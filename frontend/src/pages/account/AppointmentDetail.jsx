import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeftLong } from "react-icons/fa6";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import {
  dangerBtn,
  secondaryBtn,
} from "../../components/booking/buttonStyles";
import {
  formatLongDate,
  formatShortDate,
  formatTimeRange,
} from "../../utils/format";

const CANCELLABLE = ["pending", "confirmed"];

export default function AppointmentDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const appointmentQ = useQuery({
    queryKey: ["appointments", id],
    queryFn: () => api(`/appointments/${id}`),
  });

  const cancelM = useMutation({
    mutationFn: () =>
      api(`/appointments/${id}/status`, {
        method: "PATCH",
        body: {
          status: "cancelled",
          cancellationReason: reason.trim() || undefined,
        },
      }),
    onSuccess: () => {
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  function closeConfirm() {
    if (cancelM.isPending) return; // the request is already on its way
    setConfirmOpen(false);
    cancelM.reset();
  }

  if (appointmentQ.isPending) {
    return <p className="text-sm text-gray-500">Loading appointment...</p>;
  }

  if (appointmentQ.isError) {
    return (
      <p className="text-sm text-gray-500">
        We couldn't find this appointment.
      </p>
    );
  }

  const appt = appointmentQ.data.data.appointment;
  const ymd = appt.date.slice(0, 10);
  const canCancel = CANCELLABLE.includes(appt.status);

  return (
    <div className="space-y-5">
      <Link
        to="/account/appointments"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand md:text-sm"
      >
        <FaArrowLeftLong aria-hidden="true" /> My appointments
      </Link>

      <div className="flex items-center justify-between gap-3.5 lg:justify-start">
        <h1 className="text-2xl font-bold text-ink md:text-[32px]">
          {appt.service?.name}
        </h1>
        <StatusBadge status={appt.status} />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <dl className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-1.5 md:px-5 lg:flex-1">
          {[
            ["Dentist", appt.doctor?.name],
            [
              "Date",
              <>
                <span className="hidden lg:inline">
                  {formatLongDate(ymd)}, {ymd.slice(0, 4)}
                </span>
                <span className="lg:hidden">
                  {formatShortDate(ymd)}, {ymd.slice(0, 4)}
                </span>
              </>,
            ],
            ["Time", formatTimeRange(appt.timeSlot, appt.duration)],
            ["Duration", `${appt.duration} min`],
            ["Price", `$${appt.price}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="text-gray-500">{k}</dt>
              <dd className="text-right font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {canCancel && (
          <section className="w-full space-y-3.5 lg:w-90 lg:shrink-0 lg:rounded-xl lg:bg-gray-100 lg:p-5">
            <h2 className="text-lg font-bold text-ink">Need to cancel?</h2>

            <div className="space-y-1.5">
              <label
                htmlFor="cancel-reason"
                className="block text-[13px] font-medium text-ink"
              >
                Reason (optional)
              </label>
              <textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. I have a work conflict"
                className="h-27.5 w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={secondaryBtn}
            >
              Cancel appointment
            </button>
            <p className="text-[12px] text-gray-500">
              We'll ask you to confirm first.
            </p>
          </section>
        )}
      </div>

      {/* outside the panel: the panel disappears as soon as the status changes */}
      <Modal
        open={confirmOpen}
        tone={cancelM.error ? "error" : undefined}
        title={
          cancelM.error
            ? "We couldn't cancel this appointment"
            : "Cancel this appointment?"
        }
        onClose={closeConfirm}
        actions={
          cancelM.error ? (
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
                disabled={cancelM.isPending}
                className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Keep appointment
              </button>
              <button
                type="button"
                onClick={() => cancelM.mutate()}
                disabled={cancelM.isPending}
                className={dangerBtn}
              >
                {cancelM.isPending ? "Cancelling..." : "Yes, cancel"}
              </button>
            </>
          )
        }
      >
        {cancelM.error
          ? cancelM.error.message
          : `${appt.service?.name} with ${appt.doctor?.name} on ${formatShortDate(ymd)}. You can't undo this.`}
      </Modal>
    </div>
  );
}
