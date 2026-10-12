import { useParams, Link } from "react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { formatTime } from "../../utils/format";
import ReviewCard from "../../components/ReviewCard";
import { FaArrowLeftLong, FaStar } from "react-icons/fa6";

const WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function DoctorProfile() {
  const { doctorId } = useParams();

  const doctorQ = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => api(`/doctors/${doctorId}`),
  });

  const scheduleQ = useQuery({
    queryKey: ["schedule", doctorId],
    queryFn: () => api(`/schedules/${doctorId}`),
  });

  const reviewsQ = useInfiniteQuery({
    queryKey: ["reviews", "doctor", doctorId],
    queryFn: ({ pageParam }) =>
      api(`/reviews?type=doctor&doctor=${doctorId}&page=${pageParam}&limit=5`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  if (doctorQ.isPending) return <p className="p-10">Loading...</p>;

  if (doctorQ.isError && doctorQ.error.status === 404)
    return (
      <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold text-ink">Doctor not found</h1>
        <p className="mt-2 text-gray-500">
          This Doctor as of now is currently not available.
        </p>
        <Link
          to="/doctors"
          className="mt-6 inline-flex gap-2 items-center font-semibold text-brand"
        >
          <FaArrowLeftLong /> Back to doctors
        </Link>
      </section>
    );

  if (doctorQ.isError) return <p className="p-10">{doctorQ.error.message}</p>;

  const doctor = doctorQ.data.data.doctor;
  const reviews = reviewsQ.data?.pages.flatMap((p) => p.data.reviews) ?? [];
  const totalReviews = reviewsQ.data?.pages[0].pagination.totalResults ?? 0;

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[380px_1fr]">
      {/* LEFT column */}
      <aside className="space-y-4">
        <img
          src={`/img/users/${doctor.photo}`}
          alt={doctor.name}
          className="size-40 rounded-full bg-gray-200 object-cover"
        />
        <h1 className="text-3xl font-bold text-ink">{doctor.name}</h1>
        <p className="text-gray-500">{doctor.specialization}</p>
        {doctor.ratingCount === 0 ? (
          <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[12px] font-medium text-ink">
            New
          </span>
        ) : (
          <p className="text-[13px] inline-flex items-center gap-1 font-medium text-ink">
            <FaStar className="text-accent" /> {doctor.ratingAverage} ·{" "}
            {doctor.ratingCount}
            {doctor.ratingCount === 1 ? " review" : " reviews"}
          </p>
        )}

        <Link
          to={`/book?doctor=${doctor.id}`}
          className="block rounded-full bg-brand py-3 text-center font-semibold text-white transition duration-200 ease-soft hover:bg-brand-dark"
        >
          Book with {doctor.name}
        </Link>

        <h2 className="pt-4 text-lg font-bold text-ink">Weekly hours</h2>
        {scheduleQ.isPending && (
          <p className="text-sm text-gray-500">Loading hours...</p>
        )}
        {scheduleQ.isError && (
          <p className="text-sm text-gray-500">Hours not published yet.</p>
        )}
        {scheduleQ.data && (
          <dl className="divide-y divide-gray-200 rounded-xl bg-gray-100 px-4">
            {WEEK.map((day) => {
              const blocks =
                scheduleQ.data.data.schedule.weeklyAvailability.filter(
                  (b) => b.day === day,
                );
              return (
                <div
                  key={day}
                  className="flex justify-between gap-4 py-2.5 text-sm"
                >
                  <dt className="text-gray-500">{day.slice(0, 3)}</dt>
                  <dd className="text-right font-medium text-ink">
                    {blocks.length === 0
                      ? "Off"
                      : blocks
                          .map(
                            (b) =>
                              `${formatTime(b.startTime)} - ${formatTime(b.endTime)}`,
                          )
                          .join(", ")}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </aside>

      {/* RIGHT column */}
      <div className="space-y-6">
        {doctor.bio && (
          <>
            <h2 className="text-2xl font-bold text-ink">About</h2>
            <p className="text-[17px] leading-relaxed text-ink">{doctor.bio}</p>
          </>
        )}

        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-ink">Reviews</h2>
          <span className="text-gray-500">{totalReviews} total</span>
        </div>

        {reviews.length === 0 && !reviewsQ.isPending && (
          <p className="text-gray-500">No reviews yet.</p>
        )}
        {reviews.map((r) => (
          <ReviewCard key={r._id} {...r} />
        ))}

        {reviewsQ.hasNextPage && (
          <button
            type="button"
            onClick={() => reviewsQ.fetchNextPage()}
            disabled={reviewsQ.isFetchingNextPage}
            className="rounded-full border border-gray-300 px-5 py-2.5 font-semibold text-ink transition-colors duration-150 ease-soft hover:border-brand disabled:opacity-50"
          >
            {reviewsQ.isFetchingNextPage ? "Loading..." : "Load more reviews"}
          </button>
        )}
      </div>
    </section>
  );
}
