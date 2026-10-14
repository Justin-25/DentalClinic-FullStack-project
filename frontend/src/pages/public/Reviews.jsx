import { useSearchParams } from "react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import ReviewCard from "../../components/ReviewCard";
import Stars from "../../components/Stars";

export default function Reviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type");
  const doctorId = searchParams.get("doctorId");

  const summaryQ = useQuery({
    queryKey: ["reviews", "clinic-summary"],
    queryFn: () => api("/reviews/clinic-summary"),
  });
  const doctorQ = useQuery({
    queryKey: ["doctors"],
    queryFn: () => api("/doctors"),
  });

  // build the API query string from the filter
  const params = new URLSearchParams({ limit: "10" });
  if (type) params.set("type", type);
  if (doctorId) {
    params.set("type", "doctor");
    params.set("doctor", doctorId);
  }

  const reviewsQ = useInfiniteQuery({
    queryKey: ["reviews", "list", type, doctorId],
    queryFn: ({ pageParam }) => api(`/reviews?${params}&page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
  });

  const summary = summaryQ.data?.data;
  const doctors = doctorQ.data?.data.doctors ?? [];
  const reviews = reviewsQ.data?.pages.flatMap((p) => p.data.reviews) ?? [];
  const total = reviewsQ.data?.pages[0].pagination.totalResults ?? 0;

  const pill = (active) =>
    active
      ? "shrink-0 rounded-full bg-brand px-3.5 py-2 text-[13px] font-medium text-white"
      : "shrink-0 rounded-full border border-gray-300 px-3.5 py-2 text-[13px] font-medium text-ink transition-colors duration-150 ease-soft hover:border-brand";

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-5 py-16">
      <h1 className="text-4xl font-bold text-ink">Patient reviews</h1>
      <p className="text-gray-500">
        Honest feedback from patients after their visits - about our clinic and
        each of our dentists.
      </p>

      {/* SUMMARY CARD */}
      {summary?.ratingCount > 0 && (
        <div className="flex flex-col gap-6 rounded-2xl border border-gray-300 bg-white p-7 md:flex-row md:items-center md:gap-10">
          <div>
            <p className="text-5xl font-bold text-ink">
              {summary.ratingAverage}
            </p>
            <Stars rating={summary.ratingAverage} className="mt-1 text-lg" />
            <p className="text-[13px] font-medium text-gray-500">
              {summary.ratingCount} clinic reviews
            </p>
          </div>

          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.breakdown[stars];
              const percent = (count / summary.ratingCount) * 100;
              return (
                <div
                  key={stars}
                  className="flex items-center gap-2.5 text-[12px] font-medium text-gray-500"
                >
                  <span className="w-6">{stars}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          <p className="rounded-lg bg-teal-50 px-3 py-2 text-[12px] font-semibold text-brand">
            ✓ Every review comes from a completed visit
          </p>
        </div>
      )}

      {/* FILTER PILLS: scroll sideways on small screens */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={pill(!type && !doctorId)}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ type: "clinic" })}
          className={pill(type === "clinic")}
        >
          Clinic
        </button>
        {doctors.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSearchParams({ doctorId: d.id })}
            className={pill(doctorId === d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="font-medium text-gray-500">
          Showing {reviews.length} of {total} reviews
        </p>
        <p className="font-semibold text-ink">Newest first</p>
      </div>

      {/* LIST: each card tagged "About the clinic" / "About Dr. X" */}
      <div className="grid gap-5 md:grid-cols-2">
        {reviewsQ.isPending && (
          <p className="text-gray-500">Loading reviews...</p>
        )}
        {reviewsQ.isError && (
          <p className="text-gray-500">We couldn't load reviews right now.</p>
        )}
        {reviews.length === 0 && !reviewsQ.isPending && !reviewsQ.isError && (
          <p className="text-gray-500">No reviews yet...</p>
        )}
        {reviews.map((r) => (
          <div key={r._id} className="flex flex-col gap-1.5">
            <span
              className={`self-start inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold  ${r.type === "clinic" ? "bg-gray-100 text-ink" : "bg-teal-50 text-brand"}`}
            >
              {r.type === "clinic"
                ? "About the clinic"
                : `About ${r.doctor?.name ?? "a former dentist"}`}
            </span>
            <ReviewCard {...r} className="flex-1" />
          </div>
        ))}
      </div>

      {reviewsQ.hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => reviewsQ.fetchNextPage()}
            disabled={reviewsQ.isFetchingNextPage}
            className="rounded-[10px] border border-gray-300 px-5 py-2.5 font-semibold text-ink transition-colors duration-150 ease-soft hover:border-brand disabled:opacity-50"
          >
            {reviewsQ.isFetchingNextPage ? "Loading..." : "Load more reviews"}
          </button>
        </div>
      )}
    </section>
  );
}
