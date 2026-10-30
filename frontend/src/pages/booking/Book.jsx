import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useSearchParams, Link, useLocation } from "react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../../api/client";
import Stepper from "../../components/booking/Stepper";
import BookingSummary from "../../components/booking/BookingSummary";
import BookingLogin from "../../components/booking/BookingLogin";
import MobileBar from "../../components/booking/MobileBar";
import { primaryBtn, secondaryBtn } from "../../components/booking/buttonStyles";
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
  formatLongDate,
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

  // a picked-but-not-confirmed time: local state until Continue writes it to the URL
  const [pendingTime, setPendingTime] = useState(null);

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

  // mutate() is called with the names to show on the success screen,
  // because the URL (and so service/doctor) is cleared once the booking succeeds
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
    setPendingTime(null);
    setSearchParams((prev) => {
      prev.delete(key);
      prev.delete("date");
      prev.delete("time");
      return prev;
    });
  }

  function chooseDate(ymd) {
    setPendingTime(null);
    setSearchParams((prev) => {
      prev.set("date", ymd);
      prev.delete("time");
      return prev;
    });
  }

  function confirmTime() {
    choose("time", pendingTime);
  }

  function pickAnotherTime() {
    bookM.reset();
    setPendingTime(null);
    queryClient.invalidateQueries({
      queryKey: ["availability"],
    });
    setSearchParams((prev) => {
      prev.delete("time");
      return prev;
    });
  }

  function confirmBooking() {
    bookM.mutate({ serviceName: service?.name, doctorName: doctor?.name });
  }

  const price = service ? (service.priceDiscount ?? service.price) : null;
  // the URL time once confirmed, otherwise the one being picked on step 3
  const shownTime = time ?? pendingTime;
  const timeRange =
    shownTime && service
      ? `${formatTime(shownTime)} – ${formatTime(addMinutes(shownTime, service.duration))}`
      : null;

  const isPatient = user?.role === "patient";
  const canConfirm = step === 4 && isPatient;
  const hasMobileBar = step === 3 || canConfirm;

  if (bookM.isSuccess) {
    const appt = bookM.data.data.appointment;
    const { serviceName, doctorName } = bookM.variables;

    return (
      <div className="mx-auto max-w-140 space-y-5 px-5 pb-44 pt-8 text-center md:pb-16 md:pt-20">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-gray-200 text-4xl text-ink md:size-22 md:text-[40px]">
          <FaCheck aria-hidden="true" />
        </span>
        <h1 className="text-[26px] font-bold text-ink md:text-[32px]">
          You're booked!
        </h1>
        <p className="text-sm text-gray-500 md:text-base">
          We'll confirm your appointment soon. Updates show up in My
          appointments.
        </p>
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-ink md:text-[13px]">
          Pending confirmation
        </span>

        <dl className="rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-left md:px-5 md:py-2">
          {[
            ["Service", serviceName],
            ["Dentist", doctorName],
            [
              "When",
              `${formatShortDate(appt.date.slice(0, 10))} · ${formatTime(appt.timeSlot)}`,
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="text-gray-500">{k}</dt>
              <dd className="text-right font-medium text-ink">{v || "—"}</dd>
            </div>
          ))}
        </dl>

        {/* desktop: side by side under the card */}
        <div className="hidden gap-3 md:flex">
          <Link to="/account/appointments" className={primaryBtn}>
            View my appointments
          </Link>
          <Link to="/" className={secondaryBtn}>
            Back to home
          </Link>
        </div>

        {/* mobile: stacked in the bottom bar */}
        <div className="fixed inset-x-0 bottom-0 z-10 space-y-2.5 border-t border-gray-300 bg-white px-5 py-4 md:hidden">
          <Link to="/account/appointments" className={primaryBtn}>
            View my appointments
          </Link>
          <Link to="/" className={secondaryBtn}>
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // desktop panel: Price + Confirm on the confirm step, otherwise the choices so far
  const summaryRows = canConfirm
    ? [["Price", price != null && `$${price}`]]
    : [
        ["Service", service?.name],
        ["Dentist", doctor?.name],
        ["Date", date && formatShortDate(date)],
        ["Time", timeRange],
      ];

  const continueButton = (
    <button
      type="button"
      disabled={!(step === 3 && pendingTime)}
      onClick={confirmTime}
      className={primaryBtn}
    >
      Continue
    </button>
  );

  const confirmButton = (
    <button
      type="button"
      onClick={confirmBooking}
      disabled={bookM.isPending}
      className={primaryBtn}
    >
      {bookM.isPending ? "Booking..." : "Confirm booking"}
    </button>
  );

  return (
    <div
      className={`mx-auto flex max-w-6xl gap-10 px-5 pt-10 lg:pb-10 ${hasMobileBar ? "pb-28" : "pb-10"}`}
    >
      <div className="min-w-0 flex-1 space-y-6">
        <Stepper current={step} />

        {/* mobile only: the summary panel shows this on desktop */}
        {service && (step === 2 || step === 3) && (
          <div className="flex items-center justify-between rounded-[10px] bg-gray-100 px-3 py-2.5 text-[13px] lg:hidden">
            <span className="font-medium text-ink">
              {service.name} ·{" "}
              {step === 2 ? `${service.duration} min` : doctor?.name}
            </span>
            <button
              type="button"
              onClick={() => change(step === 2 ? "service" : "doctor")}
              className="font-semibold text-brand"
            >
              Change
            </button>
          </div>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-ink md:text-[32px]">
                What do you need?
              </h1>
              <p className="text-sm text-gray-500 md:text-base">
                Choose a treatment to see dentists and open times.
              </p>
            </div>
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
            <h1 className="text-2xl font-bold text-ink md:text-[32px]">
              Choose your dentist
            </h1>
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
            <h1 className="text-2xl font-bold text-ink md:text-[32px]">
              Pick a date & time
            </h1>

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
                <p className="text-[15px] font-semibold text-ink md:text-base">
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

            {date && (
              <h2 className="text-[15px] font-semibold text-ink md:text-[18px]">
                {formatLongDate(date)}
              </h2>
            )}
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

            {/* SLOTS: Morning / Afternoon — the group says AM/PM, so the chips don't */}
            {[
              ["Morning", (t) => t < "12:00"],
              ["Afternoon", (t) => t >= "12:00"],
            ].map(([label, inGroup]) => {
              const group = (slotsQ.data?.data.slots ?? []).filter(inGroup);
              if (group.length === 0) return null;

              return (
                <div key={label} className="space-y-2">
                  <h3 className="text-[13px] font-medium text-gray-500 md:text-sm">
                    {label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.map((t) => {
                      const selected = t === pendingTime;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPendingTime(t)}
                          aria-pressed={selected}
                          aria-label={formatTime(t)}
                          className={`h-11 w-19 rounded-lg text-[15px] font-medium transition-colors duration-150 ease-soft ${
                            selected
                              ? "bg-brand text-white"
                              : "border border-gray-300 bg-white text-ink hover:border-brand hover:text-brand"
                          }`}
                        >
                          {formatTime(t).split(" ")[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {date && (
              <p className="text-[12px] text-gray-500 md:text-[13px]">
                Only open times are shown.
              </p>
            )}

            <MobileBar>{continueButton}</MobileBar>
          </section>
        )}

        {step === 4 && !user && (
          <BookingLogin
            summary={`${service?.name ?? ""} · ${doctor?.name ?? ""}`}
            when={date && timeRange && `${formatShortDate(date)} · ${timeRange}`}
            signupHref={`/signup?redirect=${encodeURIComponent(here)}`}
          />
        )}

        {step === 4 && user && (
          <section className="space-y-5">
            <h1 className="text-2xl font-bold text-ink md:text-[32px]">
              Review & confirm
            </h1>

            {/* the choices, as a list (Price lives in the panel on desktop) */}
            <dl className="rounded-xl border border-gray-300 bg-white px-4 py-1.5 md:px-5 md:py-2">
              {[
                ["Service", service?.name],
                ["Dentist", doctor?.name],
                [
                  "Date",
                  date && (
                    <>
                      <span className="hidden md:inline">
                        {formatLongDate(date)}, {date.slice(0, 4)}
                      </span>
                      <span className="md:hidden">
                        {formatShortDate(date)}, {date.slice(0, 4)}
                      </span>
                    </>
                  ),
                ],
                ["Time", timeRange],
                ["Duration", service && `${service.duration} min`],
                ["Price", price != null && `$${price}`, "lg:hidden"],
              ].map(([k, v, only = ""]) => (
                <div
                  key={k}
                  className={`flex justify-between gap-4 py-2 text-sm ${only}`}
                >
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v || "—"}</dd>
                </div>
              ))}
            </dl>

            {!isPatient ? (
              <p className="rounded-xl bg-gray-100 p-5 text-sm text-gray-500">
                Bookings are made from a patient account.
              </p>
            ) : (
              <>
                <p className="text-[13px] text-gray-500 md:text-sm">
                  Your appointment stays pending until the clinic confirms it.
                  You can cancel anytime from My appointments.
                </p>

                {bookM.error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800 md:text-sm"
                  >
                    <FaCircleExclamation
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                    />
                    {slotTaken ? (
                      <span>
                        Someone just booked this time. Please{" "}
                        <button
                          type="button"
                          onClick={pickAnotherTime}
                          className="font-semibold underline"
                        >
                          pick another one
                        </button>
                        .
                      </span>
                    ) : (
                      bookM.error.message
                    )}
                  </div>
                )}

                <MobileBar>{confirmButton}</MobileBar>
              </>
            )}
          </section>
        )}
      </div>

      <BookingSummary
        rows={summaryRows}
        hint={step === 1 ? "Pick a service to start." : null}
      >
        {step < 4 ? continueButton : canConfirm ? confirmButton : null}
      </BookingSummary>
    </div>
  );
}
