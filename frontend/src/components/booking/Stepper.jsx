import { FaCheck } from "react-icons/fa6";

const STEPS = ["Service", "Doctor", "Time", "Confirm"];

export default function Stepper({ current }) {
  return (
    <ol className="flex">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;

        return (
          <li
            key={label}
            className="flex flex-1 flex-col items-center gap-1.5"
            aria-current={active ? "step" : undefined}
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full text-[13px] font-semibold ${done || active ? "bg-brand text-white" : "border border-gray-300 text-gray-500"}`}
            >
              {done ? <FaCheck aria-hidden="true" /> : n}
            </span>
            <span
              className={`text-[12px] ${active ? "font-semibold text-ink" : "text-gray-500"}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
