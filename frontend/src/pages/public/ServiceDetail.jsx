import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FaArrowLeftLong } from "react-icons/fa6";
import { api } from "../../api/client";

export default function ServiceDetail() {
  const { slug } = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => api(`/services/${slug}`),
  });

  if (isPending) return <p className="p-10">Loading...</p>;

  if (isError && error.status === 404) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold text-ink">Service not found</h1>
        <p className="mt-2 text-gray-500">
          This service may have been removed or the link is out of date.
        </p>
        <Link
          to="/services"
          className="mt-6 inline-flex gap-2 items-center font-semibold text-brand"
        >
          <FaArrowLeftLong /> Back to services
        </Link>
      </section>
    );
  }

  if (isError) return <p className="p-10">{error.message}</p>;

  const service = data.data.service;
  const finalPrice = service.priceDiscount ?? service.price;

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:gap-16">
      <img
        src={`/img/services/${service.imageCover}`}
        alt={service.name}
        className="aspect-4/3 w-full rounded-2xl bg-gray-200 object-cover"
      />

      <div className="space-y-5">
        <Link
          to="/services"
          className="text-sm inline-flex gap-2 items-center font-semibold text-brand"
        >
          <FaArrowLeftLong /> All services
        </Link>
        <p className="text-[13px] font-semibold text-gray-500">
          {service.category}
        </p>
        <h1 className="text-4xl font-bold text-ink md:text-5xl">
          {service.name}
        </h1>

        <div className="flex items-baseline gap-3">
          <span className="font-medium text-gray-500">
            {service.duration} min
          </span>
          <span className="text-2xl font-bold text-ink">${finalPrice}</span>
          {service.priceDiscount && (
            <span className="text-gray-500 line-through">${service.price}</span>
          )}
        </div>

        <p className="text-[17px] leading-relaxed text-ink">
          {service.summary}
        </p>

        <dl className="divide-y divide-gray-200 rounded-xl bg-gray-100 px-4">
          {[
            ["Category", service.category],
            ["Duration", `${service.duration} min`],
            ["Price", `$${finalPrice}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5 text-sm">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        <Link
          to={`/book?service=${service.id}`}
          className="inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark motion-safe:hover:-translate-y-0.5"
        >
          Book this service
        </Link>
      </div>
    </section>
  );
}
