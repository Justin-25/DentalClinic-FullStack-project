import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import AppointmentCard from "../../components/AppointmentCard";
import {
  primaryBtn,
  secondaryBtn,
} from "../../components/booking/buttonStyles";
import { toYMD } from "../../utils/format";

const PAST_PAGE_SIZE = 3;

const startsAt = (a) => `${a.date.slice(0, 10)} ${a.timeSlot}`;

export default function MyAppointments() {
  const [visiblePast, setVisiblePast] = useState(PAST_PAGE_SIZE);
  const appointmentsQ = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: () => api("/appointments/myAppointments"),
  });

  const all = appointmentsQ.data?.data.appointments ?? [];
  const today = toYMD(new Date());

  const upcoming = all
    .filter((a) => a.date.slice(0, 10) >= today)
    .sort((a, b) => startsAt(a).localeCompare(startsAt(b)));
  const past = all
    .filter((a) => a.date.slice(0, 10) < today)
    .sort((a, b) => startsAt(b).localeCompare(startsAt(a)));

  const shownPast = past.slice(0, visiblePast);
  const hasMorePast = past.length > visiblePast;

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-bold text-ink md:text-[32px]">
        My appointments
      </h1>
      <Link to="/book" className={`${primaryBtn} lg:hidden`}>
        Book a new appointment
      </Link>
      {/* loading, error and "no appointments yet" messages go here */}
      {appointmentsQ.isPending && (
        <p className="text-sm text-gray-500">Loading your appointments...</p>
      )}
      {appointmentsQ.isError && (
        <p className="text-sm text-gray-500">
          We couldn't load your appointments. Please try again.
        </p>
      )}
      {appointmentsQ.isSuccess && all.length === 0 && (
        <p className="text-sm text-gray-500">
          You don't have any appointments yet.
        </p>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink md:text-xl">Upcoming</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((a) => (
              <AppointmentCard key={a._id} appointment={a} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-4 md:space-y-5">
          <h2 className="text-lg font-bold text-ink md:text-xl">Past</h2>
          {shownPast.map((a) => (
            <div
              key={a._id}
              className="flex flex-col gap-4 md:flex-row md:items-center"
            >
              <AppointmentCard appointment={a} className="flex-1" />
              {a.status === "completed" && (
                <Link
                  to={`/account/appointments/${a._id}/review`}
                  className={`${secondaryBtn} md:w-37.5 md:shrink-0`}
                >
                  Leave a review
                </Link>
              )}
            </div>
          ))}

          {hasMorePast && (
            <button
              type="button"
              onClick={() => setVisiblePast((n) => n + PAST_PAGE_SIZE)}
              className={`${secondaryBtn} md:mx-auto md:w-48`}
            >
              Load more
            </button>
          )}
        </section>
      )}
    </div>
  );
}
