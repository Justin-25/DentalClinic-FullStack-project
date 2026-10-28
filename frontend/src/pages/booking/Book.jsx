import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import Stepper from "../../components/booking/Stepper";
import BookingSummary from "../../components/booking/BookingSummary";
import ServiceCard from "../../components/ServiceCard";
import DoctorCard from "../../components/DoctorCard";
import {
  addMinutes,
  formatShortDate,
  formatTime,
  toYMD,
  weekdayOf,
} from "../../utils/format";

export default function Book() {
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

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return toYMD(d);
  });

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
                another dentists.
              </p>
            )}

            {/* DAY CHIPS: scroll sideways */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((ymd) => {
                const off = isOff(ymd);
                const selected = ymd === date;
                const [weekday, , dayNum] = formatShortDate(ymd)
                  .replace(",", "")
                  .split(" ");

                return (
                  <button
                    key={ymd}
                    type="button"
                    disabled={off}
                    onClick={() => chooseDate(ymd)}
                    aria-pressed={selected}
                    className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2.5 transition-colors duration-150 ease-soft
                      ${selected ? "bg-brand text-white" : off ? "cursor-not-allowed bg-gray-100 text-gray-400" : "border border-gray-300 bg-white text-ink hover:border-brand"}`}
                  >
                    <span className="text-[12px] font-medium">{weekday}</span>
                    <span className="text-xl font-semibold">{dayNum}</span>
                    {off && <span className="text-[10px]">Off</span>}
                  </button>
                );
              })}
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
                        className="w-24 rounded-lg border border-gray-300 bg-white py-2.5 text-[15px] font-medium text-ink transition-colors duration-150 ease-soft hover:border-brand hover:text-brand"
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
          <p className="text-gray-500">Review & confirm - next part (9c).</p>
        )}
      </div>

      <BookingSummary
        service={service}
        doctor={doctor}
        date={date && formatShortDate(date)}
        time={
          time &&
          service &&
          `${formatTime(time)} - ${formatTime(addMinutes(time, service.duration))}`
        }
      />
    </div>
  );
}
