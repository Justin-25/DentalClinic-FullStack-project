import { formatMonthYear } from "../utils/format";
import { FaRegStar, FaStar } from "react-icons/fa";

export default function ReviewCard({ rating, review, patient, createdAt }) {
  return (
    <article className="space-y-2 rounded-xl border border-gray-300 bg-white p-4">
      <p
        className="text-accent inline-flex items-center gap-1"
        role="img"
        aria-label={`${rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }, (_, i) =>
          i < rating ? (
            <FaStar key={i} aria-hidden="true" />
          ) : (
            <FaRegStar key={i} aria-hidden="true" />
          ),
        )}
      </p>
      <p className="text-ink">"{review}"</p>
      <p className="text-[12px] font-medium text-gray-500">
        {patient?.name ?? "Former patient"} · {formatMonthYear(createdAt)}
      </p>
    </article>
  );
}
