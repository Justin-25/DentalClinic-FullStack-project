import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import Stepper from "../../components/booking/Stepper";
import BookingSummary from "../../components/booking/BookingSummary";
import ServiceCard from "../../components/ServiceCard";
import DoctorCard from "../../components/DoctorCard";

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

  const services = servicesQ.data?.data.services ?? [];
  const doctors = doctorsQ.data?.data.doctors ?? [];
  const service = services.find((s) => s.id === serviceId);
  const doctor = doctors.find((d) => d.id === doctorId);

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
          <p className="text-gray-500">Date & time - next part (9b).</p>
        )}
        {step === 4 && (
          <p className="text-gray-500">Review & confirm - next part (9c).</p>
        )}
      </div>

      <BookingSummary
        service={service}
        doctor={doctor}
        date={date}
        time={time}
      />
    </div>
  );
}
