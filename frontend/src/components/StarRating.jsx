import { FaRegStar, FaStar } from "react-icons/fa";

const STARS = [1, 2, 3, 4, 5];

export default function StarRating({ value, onChange, labelledBy }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex gap-1">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} out of 5 stars`}
          onClick={() => onChange(star)}
          className="text-4xl text-[#E0A526] transition-transform duration-150 ease-soft hover:-translate-y-0.5 motion-reduce:transform-none md:text-[40px]"
        >
          {star <= value ? (
            <FaStar aria-hidden="true" />
          ) : (
            <FaRegStar aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );
}
