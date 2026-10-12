import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import Reveal from "../../components/Reveal";
import DoctorCard from "../../components/DoctorCard";

export default function Doctors() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => api("/doctors"),
  });

  if (isPending) return <p className="p-10">Loading...</p>;
  if (isError) return <p className="p-10">{error.message}</p>;

  const doctors = data.data.doctors;

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-bold text-ink">Our dentists</h1>
      <p className="mt-2 text-gray-500">
        Every dentist's open times are live - pick the one that suits you.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {doctors.map((doctor, i) => (
          <Reveal
            key={doctor.id}
            delay={Math.min(i, 6) * 60}
            className="h-full"
          >
            <Link
              to={`/doctors/${doctor.id}`}
              className="lift block h-full rounded-xl border border-gray-300 bg-white p-4"
            >
              <DoctorCard
                name={doctor.name}
                photo={doctor.photo}
                specialization={doctor.specialization}
                yearsOfExperience={doctor.yearsOfExperience}
                ratingAverage={doctor.ratingAverage}
                ratingCount={doctor.ratingCount}
              />
            </Link>
          </Reveal>
        ))}
      </div>

      {doctors.length === 0 && (
        <p className="mt-8 text-gray-500">
          No dentists are available right now.
        </p>
      )}
    </section>
  );
}
