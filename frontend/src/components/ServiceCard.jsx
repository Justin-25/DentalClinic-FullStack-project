import { IoIosArrowForward } from "react-icons/io";

export default function ServiceCard({
  imageCover,
  name,
  summary,
  duration,
  price,
  priceDiscount,
}) {
  return (
    <div className="flex items-center gap-3.5">
      <img
        src={`/img/services/${imageCover}`}
        alt=""
        loading="lazy"
        className="size-16 shrink-0 rounded-[10px] bg-gray-200 object-cover"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-base font-semibold text-ink">{name}</h2>
        <p className="text-[13px] text-gray-500 truncate line-clamp-2">
          {summary}
        </p>
        <p className="text-[13px] font-medium text-ink">
          {duration} min · ${priceDiscount ? priceDiscount : price}
          {priceDiscount && (
            <span className="text-gray-500"> (was ${price})</span>
          )}
        </p>
      </div>

      <span className="text-2xl text-gray-400" aria-hidden="true">
        <IoIosArrowForward />
      </span>
    </div>
  );
}
