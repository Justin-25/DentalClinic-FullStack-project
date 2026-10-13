import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { FaStar } from "react-icons/fa";
import heroImg from "../../assets/hero-clinic.jpg";
import Reveal from "../../components/Reveal";
import ServiceCard from "../../components/ServiceCard";
import DoctorCard from "../../components/DoctorCard";
import ReviewCard from "../../components/ReviewCard";

function SectionHeader({ title, linkTo, linkText }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold text-ink">{title}</h2>
      {linkTo && (
        <Link to={linkTo} className="font-semibold text-brand">
          {linkText}
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const servicesQ = useQuery({
    queryKey: ["services"],
    queryFn: () => api("/services"),
  });

  const doctorsQ = useQuery({
    queryKey: ["doctors"],
    queryFn: () => api("/doctors"),
  });

  const reviewsQ = useQuery({
    queryKey: ["reviews", "clinic"],
    queryFn: () => api("/reviews?type=clinic&limit=3"),
  });

  const summaryQ = useQuery({
    queryKey: ["reviews", "clinic-summary"],
    queryFn: () => api("/reviews/clinic-summary"),
  });

  const services = servicesQ.data?.data.services.slice(0, 3) ?? [];
  const doctors = doctorsQ.data?.data.doctors.slice(0, 3) ?? [];
  const reviews = reviewsQ.data?.data.reviews ?? [];
  const summary = summaryQ.data?.data;

  return (
    <>
      {/* HERO - no data, renders instantly */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold leading-tight text-ink md:text-5xl">
            Gentle dental care for the whole family
          </h1>
          <p className="text-lg text-gray-500">
            Book a visit with our dentists in under a minute - see real open
            times, no phone calls.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/book"
              className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark motion-safe:hover:-translate-y-0.5"
            >
              Book an appointment
            </Link>
            <Link
              to="/services"
              className="rounded-full border border-gray-300 px-6 py-3 font-semibold text-ink transition-colors duration-150 ease-soft hover:border-brand"
            >
              View services
            </Link>
          </div>
        </div>
        <img
          src={heroImg}
          alt="A bright, calm treatment room at Tooth Fairy Dentistry"
          fetchPriority="high"
          className="aspect-7/5 w-full rounded-2xl bg-gray-200 object-cover"
        />
      </section>

      {/* POPULAR SERVICES */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl space-y-6 px-5 py-16">
          <SectionHeader
            title="Popular services"
            linkTo="/services"
            linkText="See all services →"
          />
          {servicesQ.isPending && (
            <p className="text-gray-500">Loading services...</p>
          )}
          {servicesQ.isError && (
            <p className="text-gray-500">
              We couldn't load services right now.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={i * 60} className="h-full">
                <Link
                  to={`/services/${s.slug}`}
                  className="lift block h-full rounded-xl border border-gray-300 bg-white p-4"
                >
                  <ServiceCard {...s} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MEET OUR DENTISTS */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl space-y-6 px-5 py-16">
          <SectionHeader
            title="Meet our dentists"
            linkTo="/doctors"
            linkText="See all dentists →"
          />
          {doctorsQ.isPending && (
            <p className="text-gray-500">Loading dentists...</p>
          )}
          {doctorsQ.isError && (
            <p className="text-gray-500">
              We couldn't load dentists right now.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {doctors.map((d, i) => (
              <Reveal key={d.id} delay={i * 60} className="h-full">
                <Link
                  to={`/doctors/${d.id}`}
                  className="lift block h-full rounded-xl border border-gray-300 bg-white p-4"
                >
                  <DoctorCard {...d} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT PATIENTS SAY */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl space-y-6 px-5 py-16">
          <SectionHeader
            title="What patients say"
            linkTo="/reviews"
            linkText="Read all reviews →"
          />
          {reviewsQ.isPending && (
            <p className="text-gray-500">Loading reviews...</p>
          )}
          {reviewsQ.isError && (
            <p className="text-gray-500">We couldn't load reviews right now.</p>
          )}
          {reviews.length === 0 && !reviewsQ.isPending && !reviewsQ.isError && (
            <p className="text-gray-500">No reviews yet...</p>
          )}
          {summary?.ratingCount > 0 && (
            <p className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <FaStar className="text-accent" aria-hidden="true" />
              {summary.ratingAverage} average · {summary.ratingCount} clinic{" "}
              {summary.ratingCount === 1 ? "review" : "reviews"}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r._id} delay={i * 60} className="h-full">
                <ReviewCard {...r} className="h-full" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
