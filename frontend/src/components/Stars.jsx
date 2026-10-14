import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

export default function Stars({ rating, className = "" }) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={`inline-flex items-center gap-0.5 text-accent ${className}`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        if (i + 1 <= rounded) return <FaStar key={i} aria-hidden="true" />;
        if (i + 1 / 2 === rounded)
          return <FaStarHalfAlt key={i} aria-hidden="true" />;
        return <FaRegStar key={i} aria-hidden="true" />;
      })}
    </span>
  );
}
