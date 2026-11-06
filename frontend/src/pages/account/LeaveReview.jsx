import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeftLong, FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import StarRating from "../../components/StarRating";
import { primaryBtn } from "../../components/booking/buttonStyles";
import { formatShortDate } from "../../utils/format";

const TABS = [
  ["doctor", "Rate your dentist"],
  ["clinic", "Rate the clinic"],
];

export default function LeaveReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState("doctor");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const appointmentQ = useQuery({
    queryKey: ["appointments", id],
    queryFn: () => api(`/appointments/${id}`),
  });

  const myReviewsQ = useQuery({
    queryKey: ["reviews", "mine"],
    queryFn: () => api("/reviews/mine"),
  });

  const reviewM = useMutation({
    mutationFn: () =>
      api("/reviews", {
        method: "POST",
        body: {
          appointment: id,
          type,
          rating,
          review: review.trim(),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });

  function chooseTab(next) {
    setType(next);
    setRating(0);
    setReview("");
    reviewM.reset();
  }

  if (appointmentQ.isPending) {
    return <p className="text-sm text-gray-500">Loading your visit...</p>;
  }

  if (appointmentQ.isError) {
    return (
      <p className="text-sm text-gray-500">We couldn't find this visit.</p>
    );
  }

  const appt = appointmentQ.data.data.appointment;
  const ymd = appt.date.slice(0, 10);
  const myReviews = myReviewsQ.data?.data.reviews ?? [];

  const alreadyReviewed = myReviews.some((r) =>
    type === "clinic"
      ? r.type === "clinic"
      : r.type === "doctor" && r.appointment === id,
  );

  const isDuplicate = reviewM.error?.code === "DUPLICATE_VALUE";
  const errorMessage =
    alreadyReviewed || isDuplicate
      ? type === "clinic"
        ? "You've already reviewed the clinic."
        : "You've already reviewed this visit."
      : reviewM.error?.message;

  const canSubmit =
    rating > 0 &&
    review.trim() !== "" &&
    !alreadyReviewed &&
    !reviewM.isPending;

  function handleSubmit(e) {
    e.preventDefault();
    reviewM.mutate();
  }

  return (
    <div className="space-y-5">
      <Link
        to="/account/appointments"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand md:text-sm"
      >
        <FaArrowLeftLong aria-hidden="true" /> My appointments
      </Link>

      <form onSubmit={handleSubmit} className="max-w-150 space-y-4" noValidate>
        <h1 className="text-[26px] font-bold text-ink md:text-[32px]">
          How was your visit?
        </h1>

        <div className="space-y-0.5 rounded-[10px] bg-gray-100 p-3 md:p-3.5">
          <p className="text-sm font-semibold text-ink md:text-[15px]">
            {appt.service?.name} · {appt.doctor?.name}
          </p>
          <p className="text-[13px] text-gray-500">
            {formatShortDate(ymd)}, {ymd.slice(0, 4)}
          </p>
        </div>

        <div className="flex gap-1 rounded-[10px] bg-gray-100 p-1">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => chooseTab(value)}
              className={`h-9.25 flex-1 rounded-lg text-sm transition-colors duration-150 ease-soft ${type === value ? "bg-white font-semibold text-ink" : "font-medium text-gray-500"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p
            id="rating-label"
            className="text-[13px] font-medium text-ink md:text-sm"
          >
            Your rating
          </p>
          <StarRating
            value={rating}
            onChange={setRating}
            labelledBy="rating-label"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="review-text"
            className="block text-[13px] font-medium text-ink"
          >
            Your review
          </label>
          <textarea
            id="review-text"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What went well? What could be better?"
            className="h-27.5 w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
          >
            <FaCircleExclamation
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`${primaryBtn} md:w-36`}
        >
          {reviewM.isPending ? "Submitting..." : "Submit review"}
        </button>
      </form>

      <Modal
        open={reviewM.isSuccess}
        title="Thanks for your review!"
        onClose={() => navigate("/account/appointments")}
        actions={
          <Link to="/account/appointments" className={primaryBtn}>
            Back to My appointments
          </Link>
        }
      >
        Your feedback helps other patients choose with confidence.
      </Modal>
    </div>
  );
}
