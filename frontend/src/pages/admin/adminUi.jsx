import { useId } from "react";

// Shared bits of the admin tables: filters, table cells, the Prev / Next pager.

export const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export const tableBox = "hidden overflow-hidden rounded-xl border border-gray-300 lg:block";
export const theadClass = "bg-gray-100 text-[12px] uppercase text-gray-500";
export const th = "py-3.5 pl-4 font-semibold first:pl-5 last:pr-5";
export const td = "py-3.5 pl-4 first:pl-5 last:pr-5";
export const rowClass = "border-t border-gray-300";
export const cardClass = "rounded-xl border border-gray-300 bg-white p-3.5";
export const textLink =
  "text-[13px] font-semibold text-brand transition-colors duration-150 ease-soft hover:text-brand-dark";

// a labelled <select> for the filter row; options are [value, label] pairs
export function FilterSelect({ label, value, onChange, options, className = "" }) {
  const id = useId();
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SearchField({ label, value, onChange, placeholder, className = "" }) {
  const id = useId();
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </div>
  );
}

const pagerBtn =
  "h-10 rounded-[10px] border border-gray-400 bg-white px-4 text-sm font-semibold text-ink transition-colors duration-150 ease-soft hover:border-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-400";

export function Pager({ summary, page, pageCount, onPage }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] text-gray-500">{summary}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={pagerBtn}>
          ‹ Prev
        </button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pageCount} className={pagerBtn}>
          Next ›
        </button>
      </div>
    </div>
  );
}
