import { formatMonthYear } from "../utils/format";
import Stars from "./Stars";

export default function ReviewCard({
  rating,
  review,
  patient,
  createdAt,
  className = "",
}) {
  return (
    <article
      className={`space-y-2 rounded-xl border border-gray-300 bg-white p-4 ${className}`}
    >
      <Stars rating={rating} />
      <p className="text-ink">"{review}"</p>
      <p className="text-[12px] font-medium text-gray-500">
        {patient?.name ?? "Former patient"} · {formatMonthYear(createdAt)}
      </p>
    </article>
  );
}
