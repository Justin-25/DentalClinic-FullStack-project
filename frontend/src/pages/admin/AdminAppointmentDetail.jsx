import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeftLong } from "react-icons/fa6";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import { dangerBtn, primaryBtn, secondaryBtn } from "../../components/booking/buttonStyles";
import { formatLongDate, formatShortDate, formatTimeRange } from "../../utils/format";
import { ADMIN_ACTIONS, CONFIRM } from "./adminActions";

// The doctor's detail layout with the dentist added; admins can also change the status (and cancel).
export default function AdminAppointmentDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(null); // the action being confirmed
  const [reason, setReason] = useState("");

  // same key and shape as the doctor's detail page (same endpoint)
  const appointmentQ = useQuery({
    queryKey: ["appointments", id],
    queryFn: () => api(`/appointments/${id}`),
  });

  const statusM = useMutation({
    mutationFn: (status) =>
      api(`/appointments/${id}/status`, {
        method: "PATCH",
        body: {
          status,
          ...(status === "cancelled" && reason.trim() ? { cancellationReason: reason.trim() } : {}),
        },
      }),
    onSuccess: () => setConfirming(null),
    // this page, the admin list, the doctor's and patient's lists; a cancel frees the slot
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["availability"] }),
      ]),
  });

  function openConfirm(action) {
    statusM.reset();
    setReason("");
    setConfirming(action);
  }
  function closeConfirm() {
    if (!statusM.isPending) setConfirming(null);
  }

  const back = (
    <Link
      to="/admin/appointments"
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand md:text-sm"
    >
      <FaArrowLeftLong aria-hidden="true" /> Appointments
    </Link>
  );

  if (appointmentQ.isPending) return <p className="text-sm text-gray-500">Loading appointment...</p>;
  if (appointmentQ.isError) {
    return (
      <div className="space-y-5">
        {back}
        <p className="text-sm text-gray-500">We couldn't find this appointment.</p>
      </div>
    );
  }

  const appt = appointmentQ.data.data.appointment;
  const ymd = appt.date.slice(0, 10);
  const actions = ADMIN_ACTIONS[appt.status] ?? [];
  const name = appt.patient?.name ?? "the patient";
  const cancelling = confirming?.status === "cancelled";

  return (
    <div className="space-y-5">
      {back}

      <div className="flex items-center justify-between gap-3.5 lg:justify-start">
        <h1 className="text-2xl font-bold text-ink md:text-[32px]">{appt.patient?.name}</h1>
        <StatusBadge status={appt.status} />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <dl className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-1.5 md:px-5 lg:flex-1">
          {[
            ["Dentist", appt.doctor?.name],
            ["Service", appt.service?.name],
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

        {/* pending or confirmed: what can happen next (completed, cancelled and no-show are final) */}
        {actions.length > 0 && (
          <section className="w-full space-y-3 lg:w-85 lg:shrink-0 lg:rounded-xl lg:bg-gray-100 lg:p-5">
            <h2 className="hidden text-lg font-bold text-ink lg:block">Update status</h2>
            {actions.map((action, i) => (
              <button
                key={action.status}
                type="button"
                onClick={() => openConfirm(action)}
                className={i === 0 ? primaryBtn : secondaryBtn}
              >
                {action.label}
              </button>
            ))}
          </section>
        )}

        {appt.status === "cancelled" && (
          <section className="w-full space-y-1 rounded-[10px] bg-gray-100 p-3.5 text-[13px] lg:w-85 lg:shrink-0">
            <h2 className="font-semibold text-ink">Cancelled</h2>
            <p className="text-gray-500">
              {appt.cancellationReason ? `"${appt.cancellationReason}"` : "No reason given."}
            </p>
          </section>
        )}
      </div>

      <Modal
        open={confirming !== null}
        tone={statusM.isError ? "error" : undefined}
        title={statusM.isError ? "We couldn't update this appointment" : confirming && CONFIRM[confirming.status].title(name)}
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
                onClick={() => statusM.mutate(confirming.status)}
                disabled={statusM.isPending}
                className={cancelling ? dangerBtn : primaryBtn}
              >
                {statusM.isPending ? "Saving..." : confirming && CONFIRM[confirming.status].button}
              </button>
            </>
          )
        }
      >
        {statusM.isError ? (
          statusM.error.message
        ) : cancelling ? (
          <div className="space-y-3">
            <p>The time slot opens up again. This can't be undone.</p>
            <div className="space-y-1.5">
              <label htmlFor="admin-cancel-reason" className="block text-[13px] font-medium text-ink">
                Reason (optional)
              </label>
              <textarea
                id="admin-cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. The dentist is unavailable"
                className="h-20 w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        ) : (
          "This can't be undone."
        )}
      </Modal>
    </div>
  );
}
