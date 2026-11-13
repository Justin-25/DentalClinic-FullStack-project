import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FaArrowLeftLong } from "react-icons/fa6";
import { api } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import {
  primaryBtn,
  secondaryBtn,
} from "../../components/booking/buttonStyles";
import {
  formatLongDate,
  formatShortDate,
  formatTimeRange,
} from "../../utils/format";
import { NEXT_ACTIONS } from "./doctorActions";
import { useStatusChange } from "./useStatusChange";

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const { openConfirm, modal } = useStatusChange();

  const appointmentQ = useQuery({
    queryKey: ["appointments", id],
    queryFn: () => api(`/appointments/${id}`),
  });

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
  const actions = NEXT_ACTIONS[appt.status] ?? [];
  const isCancelled = appt.status === "cancelled";

  return (
    <div className="space-y-5">
      <Link
        to="/doctor/appointments"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand md:text-sm"
      >
        <FaArrowLeftLong aria-hidden="true" /> Appointments
      </Link>

      <div className="flex items-center justify-between gap-3.5 lg:justify-start">
        <h1 className="text-2xl font-bold text-ink md:text-[32px]">
          {appt.patient?.name}
        </h1>
        <StatusBadge status={appt.status} />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <dl className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-1.5 md:px-5 lg:flex-1">
          {[
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

        {/* pending or confirmed: the button */}
        {actions.length > 0 && (
          <section className="w-full space-y-3 lg:w-85 lg:shrink-0 lg:rounded-xl lg:bg-gray-100 lg:p-5">
            <h2 className="hidden text-lg font-bold text-ink lg:block">
              Update status
            </h2>
            {actions.map((action, i) => (
              <button
                key={action.status}
                type="button"
                onClick={() => openConfirm(appt, action)}
                className={i === 0 ? primaryBtn : secondaryBtn}
              >
                {action.longLabel}
              </button>
            ))}
            {appt.status === "confirmed" && (
              <p className="hidden text-[12px] text-gray-500 lg:block">
                Completed visits let the patient leave a review.
              </p>
            )}
          </section>
        )}

        {isCancelled && (
          <section className="w-full space-y-1 rounded-[10px] bg-gray-100 p-3.5 text-[13px] lg:w-85 lg:shrink-0">
            <h2 className="font-semibold text-ink">Cancelled</h2>
            <p className="text-gray-500">
              {appt.cancellationReason
                ? `"${appt.cancellationReason}"`
                : "No reason given."}
            </p>
          </section>
        )}
      </div>

      {modal}
    </div>
  );
}
