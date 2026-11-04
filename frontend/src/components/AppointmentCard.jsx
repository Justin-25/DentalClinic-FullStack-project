import { Link } from "react-router";
import StatusBadge from "./StatusBadge";
import { formatShortDate, formatTimeRange } from "../utils/format";

export default function AppointmentCard({ appointment, className = "" }) {
  const { _id, date, timeSlot, duration, status, service, doctor } =
    appointment;
  const ymd = date.slice(0, 10);
  const [weekday, month] = formatShortDate(ymd).replace(",", "").split(" ");

  return (
    <Link
      to={`/account/appointments/${_id}`}
      className={`lift flex gap-3.5 rounded-xl border border-gray-300 bg-white p-4 ${className}`}
    >
      <div className="h-14 shrink-0 self-start rounded-[10px] bg-gray-100 px-2.5 py-2 text-center">
        <p className="text-[11px] font-semibold uppercase leading-tight text-gray-500">
          {month}
        </p>
        <p className="text-[22px] font-bold leading-tight text-ink">
          {ymd.slice(8)}
        </p>
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className="text-base font-semibold text-ink">{service?.name}</h3>
        <p className="text-[13px] text-gray-500">{doctor?.name}</p>
        <p className="text-[13px] font-medium text-ink">
          {weekday} · {formatTimeRange(timeSlot, duration)}
        </p>
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}
