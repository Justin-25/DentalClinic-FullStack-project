import { FaStar } from "react-icons/fa";

export default function DoctorCard({
  name,
  photo,
  specialization,
  yearsOfExperience,
  ratingAverage,
  ratingCount,
}) {
  return (
    <div className="flex items-start gap-3.5">
      <img
        src={`/img/users/${photo}`}
        alt=""
        loading="lazy"
        className="size-16 shrink-0 rounded-full bg-gray-200 object-cover"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-base font-semibold text-ink">{name}</h2>
        <p className="text-[13px] text-gray-500">
          {specialization}
          {yearsOfExperience > 0
            ? ` · ${yearsOfExperience} yrs experience`
            : undefined}
        </p>

        {ratingCount === 0 ? (
          <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[12px] font-medium text-ink">
            New
          </span>
        ) : (
          <p className="text-[13px] inline-flex items-center gap-1 font-medium text-ink">
            <FaStar className="text-accent" /> {ratingAverage} · {ratingCount}
            {ratingCount === 1 ? " review" : " reviews"}
          </p>
        )}
      </div>
    </div>
  );
}
