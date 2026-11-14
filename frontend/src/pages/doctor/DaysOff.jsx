import { useState } from "react";
import TextField from "../../components/TextField";
import { secondaryBtn } from "../../components/booking/buttonStyles";
import { formatShortDate, toYMD } from "../../utils/format";

export default function DaysOff({ daysOff, onChange }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const today = toYMD(new Date());

  function handleAdd(e) {
    e.preventDefault();
    if (!date) return setError("Pick a date.");
    if (date < today) return setError("Pick today or a later date.");
    if (daysOff.some((ex) => ex.date === date))
      return setError("That day is already off.");
    onChange([...daysOff, { date, reason: reason.trim() }]);
    setDate("");
    setReason("");
    setError(null);
  }

  return (
    <section className="w-full space-y-3 lg:w-85 lg:shrink-0 lg:rounded-xl lg:border lg:border-gray-300 lg:bg-white lg:p-5">
      <h2 className="text-[22px] font-bold text-ink lg:text-xl">Days off</h2>

      {daysOff.length === 0 ? (
        <p className="text-[13px] text-gray-500">No days off planned.</p>
      ) : (
        <ul className="space-y-2">
          {daysOff.map((d) => {
            const label = `${formatShortDate(d.date)}, ${d.date.slice(0, 4)}`;
            return (
              <li
                key={d.date}
                className="flex items-center justify-between gap-3 rounded-[10px] bg-gray-100 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  {d.reason && (
                    <p className="text-[13px] text-gray-500">{d.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange(daysOff.filter((other) => other !== d))
                  }
                  aria-label={`Remove ${label}`}
                  className="shrink-0 text-[13px] font-semibold text-brand transition-colors duration-150 ease-soft hover:text-brand-dark"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} noValidate className="space-y-3">
        <TextField
          label="Date"
          type="date"
          min={today}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError(null);
          }}
          error={error}
        />
        <TextField
          label="Reason (optional)"
          placeholder="e.g. Conference"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button type="submit" className={secondaryBtn}>
          Add day off
        </button>
      </form>
    </section>
  );
}
