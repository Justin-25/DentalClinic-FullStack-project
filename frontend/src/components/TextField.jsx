import { useId } from "react";

export default function TextField({ label, error, ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
        className={`w-full rounded-lg border bg-white px-3.5 py-3 text-[15px] leading-tight text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:ring-2
          ${error ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:border-brand focus:ring-brand/20"}`}
      />
      {error && (
        <p id={errorId} className="text-[12px] font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
