import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import { formatMonthDay, formatTime, startOfWeek, toYMD } from "../../utils/format";
import {
  cardClass,
  FilterSelect,
  Pager,
  rowClass,
  SearchField,
  tableBox,
  td,
  textLink,
  th,
  theadClass,
} from "./adminUi";
import { paginate } from "./paginate";

const PAGE_SIZE = 10;

const STATUSES = [
  ["", "All statuses"],
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["no-show", "No-show"],
];

const RANGES = [
  ["", "All dates"],
  ["today", "Today"],
  ["week", "This week"],
  ["upcoming", "Upcoming"],
  ["past", "Past"],
];

const dayOf = (a) => a.date.slice(0, 10);
const startsAt = (a) => `${dayOf(a)} ${a.timeSlot}`;
const when = (a) => `${formatMonthDay(dayOf(a))} · ${formatTime(a.timeSlot)}`;

function ViewLink({ appointment: a }) {
  return (
    <Link to={`/admin/appointments/${a._id}`} aria-label={`View ${a.patient?.name ?? "appointment"}, ${when(a)}`} className={textLink}>
      View ›
    </Link>
  );
}

function inRange(ymd, range) {
  const today = toYMD(new Date());
  if (range === "today") return ymd === today;
  if (range === "upcoming") return ymd >= today;
  if (range === "past") return ymd < today;
  if (range === "week") {
    const monday = startOfWeek(new Date());
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return ymd >= toYMD(monday) && ymd <= toYMD(sunday);
  }
  return true;
}

// Every booking across every dentist. The API sends them all, so filters and pages run here.
export default function AdminAppointments() {
  const [status, setStatus] = useState("");
  const [doctor, setDoctor] = useState("");
  const [range, setRange] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const appointmentsQ = useQuery({
    queryKey: ["appointments", "all"],
    queryFn: () => api("/appointments"),
  });
  const doctorsQ = useQuery({ queryKey: ["doctors"], queryFn: () => api("/doctors") });

  // any filter change starts again from page 1
  const filter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const term = search.trim().toLowerCase();
  const list = [...(appointmentsQ.data?.data.appointments ?? [])]
    .filter((a) => !status || a.status === status)
    .filter((a) => !doctor || a.doctor?._id === doctor)
    .filter((a) => inRange(dayOf(a), range))
    .filter((a) => !term || (a.patient?.name ?? "").toLowerCase().includes(term))
    .sort((a, b) => startsAt(a).localeCompare(startsAt(b)));
  const paged = paginate(list, page, PAGE_SIZE);

  const doctorOptions = [
    ["", "All dentists"],
    ...(doctorsQ.data?.data.doctors ?? []).map((d) => [d._id, d.name]),
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold text-ink lg:text-[32px]">Appointments</h1>
        <p className="hidden text-[13px] text-gray-500 lg:block">All bookings across every dentist</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <FilterSelect label="Status" value={status} onChange={filter(setStatus)} options={STATUSES} className="lg:w-45" />
        <FilterSelect label="Dentist" value={doctor} onChange={filter(setDoctor)} options={doctorOptions} className="hidden lg:block lg:w-45" />
        <FilterSelect label="Date" value={range} onChange={filter(setRange)} options={RANGES} className="hidden lg:block lg:w-45" />
        <SearchField label="Search" value={search} onChange={filter(setSearch)} placeholder="Patient name" className="hidden lg:ml-auto lg:block lg:w-45" />
      </div>

      {appointmentsQ.isPending && <p className="text-sm text-gray-500">Loading appointments...</p>}
      {appointmentsQ.isError && (
        <p className="text-sm text-gray-500">We couldn't load the appointments. Please try again.</p>
      )}
      {appointmentsQ.isSuccess && list.length === 0 && (
        <p className="text-sm text-gray-500">No appointments match these filters.</p>
      )}

      {list.length > 0 && (
        <>
          <div className={tableBox}>
            <table className="w-full text-left text-sm text-ink">
              <thead className={theadClass}>
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Patient</th>
                  <th className={th}>Dentist</th>
                  <th className={th}>Service</th>
                  <th className={th}>Status</th>
                  <th className={th}>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((a) => (
                  <tr key={a._id} className={rowClass}>
                    <td className={`${td} whitespace-nowrap font-semibold`}>{when(a)}</td>
                    <td className={td}>{a.patient?.name}</td>
                    <td className={td}>{a.doctor?.name}</td>
                    <td className={td}>{a.service?.name}</td>
                    <td className={td}>
                      <StatusBadge status={a.status} />
                    </td>
                    <td className={td}>
                      <ViewLink appointment={a} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {paged.items.map((a) => (
              <li key={a._id} className={`${cardClass} space-y-1`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">{a.patient?.name}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-[13px] text-gray-500">
                  {a.service?.name} · {a.doctor?.name}
                </p>
                <p className="text-[13px] text-gray-500">{when(a)}</p>
                <ViewLink appointment={a} />
              </li>
            ))}
          </ul>

          <Pager
            summary={`Showing ${paged.from}–${paged.to} of ${list.length}`}
            page={paged.page}
            pageCount={paged.pageCount}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}
