import { useId } from "react";

export default function TextField({ label, ...inputProps }) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-ink text-[15px] outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
