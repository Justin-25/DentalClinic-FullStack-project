import { Link } from "react-router";
import StatusBadge from "../../components/StatusBadge";
import { addMinutes, formatTime, formatTimeRange } from "../../utils/format";
import ActionButtons from "./ActionButtons";
import { NEXT_ACTIONS } from "./doctorActions";

const detailPath = (a) => `/doctor/appointments/${a._id}`;

export default function AppointmentList({ appointments, onAction }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-gray-300 lg:block">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-gray-100 text-[12px] uppercase text-gray-500">
            <tr>
              <th className="py-3.5 pl-5 font-semibold">Time</th>
              <th className="py-3.5 pl-4 font-semibold">Patient</th>
              <th className="py-3.5 pl-4 font-semibold">Service</th>
              <th className="py-3.5 pl-4 font-semibold">Status</th>
              <th className="py-3.5 pl-4 pr-5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a._id} className="border-t border-gray-300">
                <td className="whitespace-nowrap py-3.5 pl-5">
                  {formatTimeRange(a.timeSlot, a.duration)}
                </td>
                <td className="py-3.5 pl-4">
                  <Link
                    to={detailPath(a)}
                    className="font-semibold hover:underline"
                  >
                    {a.patient?.name}
                  </Link>
                </td>
                <td className="py-3.5 pl-4">{a.service?.name}</td>
                <td className="py-3.5 pl-4">
                  <StatusBadge status={a.status} />
                </td>
                <td className="py-3.5 pl-4 pr-5">
                  {/* the buttons when this status has actions, otherwise a dash */}
                  {NEXT_ACTIONS[a.status] ? (
                    <ActionButtons appointment={a} onAction={onAction} />
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3.5 lg:hidden">
        {appointments.map((a) => (
          <li key={a._id} className="space-y-3.5">
            <Link
              to={detailPath(a)}
              className="lift flex gap-3.5 rounded-xl border border-gray-300 bg-white p-3.5"
            >
              <div className="w-20 shrink-0 whitespace-nowrap">
                <p className="text-base font-semibold text-ink">
                  {formatTime(a.timeSlot)}
                </p>
                <p className="text-[12px] text-gray-500">
                  {formatTime(addMinutes(a.timeSlot, a.duration))}
                </p>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-[15px] font-semibold text-ink">
                  {a.patient?.name}
                </p>
                <p className="text-[13px] text-gray-500">{a.service?.name}</p>
                <StatusBadge status={a.status} />
              </div>
            </Link>
            <ActionButtons appointment={a} onAction={onAction} />
          </li>
        ))}
      </ul>
    </>
  );
}
