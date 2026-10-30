// desktop side panel: Book decides which rows and which action (Continue / Confirm) to show
export default function BookingSummary({ rows, hint, children }) {
  return (
    <aside className="sticky top-6 hidden h-fit w-90 shrink-0 space-y-2 rounded-2xl border border-gray-300 bg-white p-6 lg:block">
      <h2 className="text-lg font-bold text-ink">Your booking</h2>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
            <dt className="text-gray-500">{k}</dt>
            <dd className="text-right font-medium text-ink">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      {hint && <p className="text-[13px] text-gray-500">{hint}</p>}
      {children && <div className="pt-2">{children}</div>}
    </aside>
  );
}
