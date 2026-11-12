import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import {
  primaryBtn,
  secondaryBtn,
} from "../../components/booking/buttonStyles";
import { formatLongDate, toYMD } from "../../utils/format";
import AppointmentList from "./AppointmentList";
import { CONFIRM_TITLE } from "./doctorActions";

const TABS = [
  ["today", "Today"],
  ["upcoming", "Upcoming"],
];

const dayOf = (a) => a.date.slice(0, 10);
const startsAt = (a) => `${dayOf(a)} ${a.timeSlot}`;

function summary(list) {
  const count = `${list.length} appointment${list.length === 1 ? "" : "s"}`;
  const waiting = list.filter((a) => a.status === "pending").length;
  return waiting > 0 ? `${count} · ${waiting} waiting for confirmation` : count;
}

function groupByDay(list) {
  const days = new Map();
  for (const a of list) {
    if (!days.has(dayOf(a))) days.set(dayOf(a), []);
    days.get(dayOf(a)).push(a);
  }
  return [...days];
}

export default function DoctorAppointments() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("today");
  const [confirming, setConfirming] = useState(null);

  const appointmentsQ = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: () => api("/appointments/myAppointments"),
  });

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

  const all = appointmentsQ.data?.data.appointments ?? [];
  const today = toYMD(new Date());
  const sorted = [...all].sort((a, b) =>
    startsAt(a).localeCompare(startsAt(b)),
  );
  const todays = sorted.filter((a) => startsAt(a).slice(0, 10) === today);
  const upcoming = sorted.filter((a) => startsAt(a).slice(0, 10) > today);
  const list = tab === "today" ? todays : upcoming;

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

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-ink lg:text-[32px]">
            {tab === "today" ? formatLongDate(today) : "Upcoming"}
          </h1>
          {appointmentsQ.isSuccess && (
            <p className="text-[13px] text-gray-500 lg:text-sm">
              {summary(list)}
            </p>
          )}
        </div>
        <div className="flex gap-1 rounded-[10px] bg-gray-100 p-1 lg:w-70">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`h-9.25 flex-1 rounded-lg text-sm transition-colors duration-150 ease-soft ${tab === value ? "bg-white font-semibold text-ink" : "font-medium text-gray-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {appointmentsQ.isPending && (
        <p className="text-sm text-gray-500">Loading appointments...</p>
      )}
      {appointmentsQ.isError && !appointmentsQ.data && (
        <p className="text-sm text-gray-500">
          We couldn't load your appointments. Please try again.
        </p>
      )}
      {appointmentsQ.isSuccess && list.length === 0 && (
        <p className="text-sm text-gray-500">
          {tab === "today"
            ? "No appointments today."
            : "No upcoming appointments."}
        </p>
      )}

      {tab === "today" ? (
        todays.length > 0 && (
          <AppointmentList appointments={todays} onAction={openConfirm} />
        )
      ) : (
        <div className="space-y-6">
          {groupByDay(upcoming).map(([day, items]) => (
            <section key={day} className="space-y-3">
              <h2 className="text-base font-bold text-ink lg:text-lg">
                {formatLongDate(day)}
              </h2>
              <AppointmentList appointments={items} onAction={openConfirm} />
            </section>
          ))}
        </div>
      )}

      <Modal
        open={confirming !== null}
        tone={statusM.isError ? "error" : undefined}
        title={
          statusM.isError
            ? "We couldn't update this appointment"
            : confirming &&
              CONFIRM_TITLE[confirming.action.status](
                confirming.appointment.patient?.name,
              )
        }
        onClose={closeConfirm}
        actions={
          statusM.isError ? (
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
    </div>
  );
}
