import { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { formatTimeSpan } from "../../utils/format";
import { blockError, DEFAULT_HOURS } from "./schedule";

const timeInput =
  "block h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function DayRow({ day, blocks, onChange }) {
  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState(null);
  const working = blocks.length > 0;

  function closeEditor() {
    setAdding(false);
    setStart("");
    setEnd("");
    setError(null);
  }

  function toggle() {
    onChange(working ? [] : [{ day, ...DEFAULT_HOURS }]);
    closeEditor();
  }

  function handleAdd(e) {
    e.preventDefault();
    const problem = blockError(blocks, start, end);
    if (problem) {
      setError(problem);
      return;
    }
    onChange([...blocks, { day, startTime: start, endTime: end }]);
    closeEditor();
  }

  return (
    <li className="space-y-2.5 border-b border-gray-300 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-ink">{day}</h3>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={working}
          aria-label={`${day} working`}
          className={`rounded-full px-3.5 py-2 text-[13px] leading-4 font-medium transition-colors duration-150 ease-soft ${working ? "bg-brand text-white" : "border border-gray-300 bg-white text-ink"}`}
        >
          {working ? "Working" : "Off"}
        </button>
      </div>

      {working && (
        <div className="flex flex-wrap items-center gap-2">
          {blocks.map((b) => {
            const label = formatTimeSpan(b.startTime, b.endTime);
            return (
              <span
                key={b.startTime}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 py-1.5 pr-1.5 pl-2.5 text-[13px] font-medium text-ink"
              >
                {label}
                <button
                  type="button"
                  onClick={() =>
                    onChange(blocks.filter((other) => other !== b))
                  }
                  aria-label={`Remove ${label}`}
                  className="grid size-5 place-items-center rounded text-gray-500 transition-colors duration-150 ease-soft hover:text-ink"
                >
                  <FaXmark aria-hidden="true" className="size-3" />
                </button>
              </span>
            );
          })}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="px-1 text-[13px] font-semibold text-brand transition-colors duration-150 ease-soft hover:text-brand-dark"
            >
              + Add hours
            </button>
          )}
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} noValidate className="space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-[12px] font-medium text-gray-500">
              <span className="block">Start</span>
              <input
                type="time"
                autoFocus
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={timeInput}
              />
            </label>
            <label className="space-y-1 text-[12px] font-medium text-gray-500">
              <span className="block">End</span>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={timeInput}
              />
            </label>
            <button
              type="submit"
              className="h-9 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white transition-colors duration-150 ease-soft hover:bg-brand-dark"
            >
              Add
            </button>
            <button
              type="button"
              onClick={closeEditor}
              className="h-9 px-2 text-[13px] font-semibold text-gray-500 transition-colors duration-150 ease-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p role="alert" className="text-[12px] font-medium text-red-700">
              {error}
            </p>
          )}
        </form>
      )}
    </li>
  );
}
