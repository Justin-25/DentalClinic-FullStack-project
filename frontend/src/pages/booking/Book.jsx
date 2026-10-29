import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useSearchParams, Link, useLocation } from "react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../../api/client";
import Stepper from "../../components/booking/Stepper";
import BookingSummary from "../../components/booking/BookingSummary";
import ServiceCard from "../../components/ServiceCard";
import DoctorCard from "../../components/DoctorCard";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCircleExclamation,
  FaCheck,
} from "react-icons/fa6";
import {
  addMinutes,
  formatShortDate,
  formatTime,
  startOfWeek,
  toYMD,
  weekdayOf,
} from "../../utils/format";

export default function Book() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const here = location.pathname + location.search;
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceId = searchParams.get("service");
  const doctorId = searchParams.get("doctor");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  const step = !serviceId ? 1 : !doctorId ? 2 : !time ? 3 : 4;

  // same keys as the Services and Doctors pages -> shared cache, instant when coming from there
  const servicesQ = useQuery({
    queryKey: ["services"],
    queryFn: () => api("/services"),
  });

  const doctorsQ = useQuery({
    queryKey: ["doctors"],
    queryFn: () => api("/doctors"),
  });

  const scheduleQ = useQuery({
    queryKey: ["schedule", doctorId],
    queryFn: () => api(`/schedules/${doctorId}`),
    enabled: !!doctorId,
  });

  const slotsQ = useQuery({
    queryKey: ["availability", doctorId, date, serviceId],
    queryFn: () =>
      api(
        `/schedules/${doctorId}/availability?date=${date}&service=${serviceId}`,
      ),
    enabled: !!(doctorId && serviceId && date),
  });

  const bookM = useMutation({
    mutationFn: () =>
      api("/appointments", {
        method: "POST",
        body: {
          doctor: doctorId,
          service: serviceId,
          date,
          timeSlot: time,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["availability"],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "mine"],
      });
      setSearchParams({}, { replace: true });
    },
  });

  const slotTaken = bookM.error?.code === "SLOT_ALREADY_BOOKED";

  const MAX_WEEKS_AHEAD = 4;
  const today = toYMD(new Date());
  const thisMonday = startOfWeek(new Date());

  const [weekOffset, setWeekOffset] = useState(() => {
    if (!date) return 0;
    const diffDays = Math.round(
      (new Date(`${date}T00:00:00`) - thisMonday) / 86400000,
    );
    return Math.max(0, Math.floor(diffDays / 7));
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() + weekOffset * 7 + i);
    return toYMD(d);
  });

  const isPast = (ymd) => ymd < today;

  const services = servicesQ.data?.data.services ?? [];
  const doctors = doctorsQ.data?.data.doctors ?? [];
  const service = services.find((s) => s.id === serviceId);
  const doctor = doctors.find((d) => d.id === doctorId);
  const schedule = scheduleQ.data?.data.schedule;
  const isOff = (ymd) => {
    return (
      !schedule?.weeklyAvailability.some((b) => b.day === weekdayOf(ymd)) ||
      schedule.exceptions.some((ex) => ex.date.slice(0, 10) === ymd)
    );
  };

  function choose(key, value) {
    setSearchParams((prev) => {
      prev.set(key, value);
      return prev;
    });
  }

  function change(key) {
    setSearchParams((prev) => {
      prev.delete(key);
      prev.delete("date");
      prev.delete("time");
      return prev;
    });
  }

  function chooseDate(ymd) {
    setSearchParams((prev) => {
      prev.set("date", ymd);
      prev.delete("time");
      return prev;
    });
  }

  function pickAnotherTime() {
    bookM.reset();
    queryClient.invalidateQueries({
      queryKey: ["availability"],
    });
    setSearchParams((prev) => {
      prev.delete("time");
      return prev;
    });
  }

  const price = service ? (service.priceDiscount ?? service.price) : null;
  const timeRange =
    time && service
      ? `${formatTime(time)} – ${formatTime(addMinutes(time, service.duration))}`
      : null;

  if (bookM.isSuccess) {
    const appt = bookM.data.data.appointment;
    return (
      <div className="mx-auto max-w-xl  space-y-5 px-5 py-16 text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-teal-50 text-3xl text-brand">
          <FaCheck aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-bold text-ink">You're booked!</h1>
        <p className="text-gray-500">
          We'll confirm your appointment soon. Updates show up in My
          appointments.
        </p>
        <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-800">
          Pending confirmation
        </span>
        <p className="text-sm text-ink">
          {formatShortDate(appt.date.slice(0, 10))} •{" "}
          {formatTime(appt.timeSlot)}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/account/appointments"
            className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            View my appointments
          </Link>
          <Link
            to="/"
            className="rounded-full border border-gray-300 px-6 py-3 font-semibold text-ink hover:border-brand"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-5 py-10">
      <div className="min-w-0 flex-1 space-y-6">
        <Stepper current={step} />

        {/* chips for what's already chosen */}
        {service && step > 1 && (
          <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
            <span className="font-medium text-ink">
              {service.name} · {service.duration} min
            </span>
            <button
              type="button"
              onClick={() => change("service")}
              className="font-semibold text-brand"
            >
              Change
            </button>
          </div>
        )}

        {doctor && step > 2 && (
          <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
            <span className="font-medium text-ink">{doctor.name}</span>
            <button
              type="button"
              onClick={() => change("doctor")}
              className="font-semibold text-brand"
            >
              Change
            </button>
          </div>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h1 className="text-3xl font-bold text-ink">What do you need?</h1>
            <div className="grid gap-4 md:grid-cols-2">
              {servicesQ.isPending && (
                <p className="text-sm text-gray-500">Loading services...</p>
              )}
              {servicesQ.isError && (
                <p className="text-sm text-gray-500">
                  Services not published yet.
                </p>
              )}
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => choose("service", s.id)}
                  className="lift rounded-xl border border-gray-300 bg-white p-4 text-left"
                >
                  <ServiceCard {...s} />
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h1 className="text-3xl font-bold text-ink">Choose your dentist</h1>
            <div className="grid gap-4 md:grid-cols-2">
              {doctorsQ.isPending && (
                <p className="text-sm text-gray-500">Loading dentists...</p>
              )}
              {doctorsQ.isError && (
                <p className="text-sm text-gray-500">
                  Dentists still not available.
                </p>
              )}
              {doctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => choose("doctor", d.id)}
                  className="lift rounded-xl border border-gray-300 bg-white p-4 text-left"
                >
                  <DoctorCard {...d} />
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <h1 className="text-3xl font-bold text-ink">Pick a date & time</h1>

            {scheduleQ.isError && (
              <p className="text-gray-500">
                This dentist hasn't published their hours yet. Please choose
                another dentist.
              </p>
            )}

            {/* DAY CHIPS: one week at a time */}
            <div className="space-y-3 pb-1">
              {/* 1. week bar — ONCE, above the grid */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous week"
                  disabled={weekOffset === 0}
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="rounded-full p-2 text-ink hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FaChevronLeft aria-hidden="true" />
                </button>
                <p className="font-semibold text-ink">
                  {formatShortDate(days[0]).split(", ")[1]} –{" "}
                  {formatShortDate(days[days.length - 1]).split(", ")[1]}
                </p>
                <button
                  type="button"
                  aria-label="Next week"
                  disabled={weekOffset === MAX_WEEKS_AHEAD}
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="rounded-full p-2 text-ink hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <FaChevronRight aria-hidden="true" />
                </button>
              </div>

              {/* 2. day chips — the grid, ONE chip per day */}
              <div className="grid grid-cols-7 gap-1.5 md:flex md:gap-2.5">
                {days.map((ymd) => {
                  const past = isPast(ymd);
                  const off = !past && isOff(ymd);
                  const unavailable = past || off;
                  const selected = ymd === date;
                  const [weekday, , dayNum] = formatShortDate(ymd)
                    .replace(",", "")
                    .split(" ");

                  return (
                    <button
                      key={ymd}
                      type="button"
                      disabled={unavailable}
                      onClick={() => chooseDate(ymd)}
                      aria-pressed={selected}
                      className={`flex h-18 w-full flex-col items-center justify-center rounded-xl transition-colors md:w-15.5 md:shrink-0 duration-150 ease-soft
                      ${selected ? "bg-brand text-white" : unavailable ? "cursor-not-allowed bg-gray-100 text-gray-400" : "border border-gray-300 bg-white text-ink hover:border-brand"}`}
                    >
                      <span className="text-[12px] font-medium">{weekday}</span>
                      <span className="text-xl font-semibold">{dayNum}</span>
                      {past ? (
                        <span className="text-[10px]">Past</span>
                      ) : off ? (
                        <span className="text-[10px]">Off</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {!date && (
              <p className="text-gray-500">Pick a day to see open times.</p>
            )}
            {date && slotsQ.isPending && (
              <p className="text-gray-500">Finding open times...</p>
            )}
            {date && slotsQ.data?.data.slots.length === 0 && (
              <p className="text-gray-500">
                No openings on this day. Try another day.
              </p>
            )}

            {/* SLOTS: Morning / Afternoon */}
            {[
              ["Morning", (t) => t < "12:00"],
              ["Afternoon", (t) => t >= "12:00"],
            ].map(([label, inGroup]) => {
              const group = (slotsQ.data?.data.slots ?? []).filter(inGroup);
              if (group.length === 0) return null;

              return (
                <div key={label} className="space-y-2">
                  <h2 className="text-[13px] font-medium text-gray-500">
                    {label}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {group.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => choose("time", t)}
                        className="h-11 w-19 rounded-lg border border-gray-300 bg-white text-[15px] font-medium text-ink transition-colors duration-150 ease-soft hover:border-brand hover:text-brand"
                      >
                        {formatTime(t)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {date && (
              <p className="text-[12px] text-gray-500">
                Only open times are shown.
              </p>
            )}
          </section>
        )}
        {step === 4 && (
          <section className="space-y-5">
            <h1 className="text-3xl font-bold text-ink">Review & confirm</h1>

            {/* the choices, as a list */}
            <dl className="divide-y divide-gray-100 rounded-xl border border-gray-300 bg-white px-5">
              {[
                ["Service", service?.name],
                ["Dentist", doctor?.name],
                ["Date", date && formatShortDate(date)],
                ["Time", timeRange],
                ["Price", price != null && `$${price}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-3 text-sm">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-ink">{v || "-"}</dd>
                </div>
              ))}
            </dl>

            {!user ? (
              <div className="space-y-3 rounded-xl bg-white p-5">
                <p className="font-semibold text-ink">
                  Log in to finish booking
                </p>
                <p className="text-sm text-gray-500">
                  Your choices are saved. You'll come right back here.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/login?redirect=${encodeURIComponent(here)}`}
                    className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
                  >
                    Log in
                  </Link>
                  <Link
                    to={`/signup?redirect=${encodeURIComponent(here)}`}
                    className="rounded-full border border-gray-300 px-6 py-3 font-semibold text-ink hover:border-brand"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            ) : user.role !== "patient" ? (
              <p className="rounded-xl bg-white p-5 text-sm text-gray-500">
                Bookings are made from a patient account.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Your appointment stays pending until the clinic confirms it.
                  You can cancel anytime from My appointments.
                </p>

                {bookM.error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
                  >
                    <FaCircleExclamation
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                    />
                    {slotTaken ? (
                      <span>
                        Someone just booked this time.{" "}
                        <button
                          type="button"
                          onClick={pickAnotherTime}
                          className="font-semibold underline"
                        >
                          Pick another time
                        </button>
                      </span>
                    ) : (
                      bookM.error.message
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => bookM.mutate()}
                  disabled={bookM.isPending}
                  className="w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark disabled:opacity-60"
                >
                  {bookM.isPending ? "Booking..." : "Confirm booking"}
                </button>
              </>
            )}
          </section>
        )}
      </div>

      <BookingSummary
        service={service}
        doctor={doctor}
        date={date && formatShortDate(date)}
        time={timeRange}
      />
    </div>
  );
}
