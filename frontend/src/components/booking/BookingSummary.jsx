export default function BookingSummary({ service, doctor, date, time }) {
  const rows = [
    ["Service", service?.name],
    ["Dentist", doctor?.name],
    ["Date", date],
    ["Time", time],
  ];

  return (
    <aside className="sticky top-6 hidden h-fit w-80 shrink-0 space-y-2 rounded-2xl border border-gray-300 bg-white p-6 lg:block">
      <h2 className="text-lg font-bold text-ink">Your booking</h2>
      <dl className="divide-y divide-gray-100">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
            <dt className="text-gray-500">{k}</dt>
            <dd className="text-right font-medium text-ink">{v ?? "-"}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
