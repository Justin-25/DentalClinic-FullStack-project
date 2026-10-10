import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import Reveal from "../../components/Reveal";
import ServiceCard from "../../components/ServiceCard";

const CATEGORIES = [
  "All",
  "Preventive & Diagnostic",
  "Restorative",
  "Surgical & Specialized",
  "Cosmetic",
  "Emergency & Urgent Care",
  "Consultation",
];

export default function Services() {
  const [category, setCategory] = useState("All");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["services"],
    queryFn: () => api("/services"),
  });

  if (isPending) return <p className="p-10">Loading...</p>;
  if (isError) return <p className="p-10">{error.message}</p>;

  const services = data.data.services;
  const shown =
    category === "All"
      ? services
      : services.filter((s) => s.category === category);

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-bold text-ink text-4xl">Our services</h1>
      <p className="mt-2 text-gray-500">
        Prices and durations are exactly what you'll see when booking.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={
              c === category
                ? "rounded-full bg-brand px-3.5 py-2 text-[13px] font-medium text-white"
                : "rounded-full border border-gray-300 px-3.5 py-2 text-[13px] font-medium text-ink transition-colors duration-150 ease-soft hover:border-brand"
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {shown.map((service, i) => (
          <Reveal
            key={service.id}
            delay={Math.min(i, 6) * 60}
            className="h-full"
          >
            <Link
              to={`/services/${service.slug}`}
              className="h-full lift block rounded-xl border border-gray-300 bg-white p-4"
            >
              <ServiceCard
                imageCover={service.imageCover}
                name={service.name}
                summary={service.summary}
                duration={service.duration}
                price={service.price}
                priceDiscount={service.priceDiscount}
              />
            </Link>
          </Reveal>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-8 text-gray-500">No services in this category yet.</p>
      )}
    </section>
  );
}
