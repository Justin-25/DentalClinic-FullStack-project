// filter pills (Users roles, Reviews types): filled teal when selected, outlined otherwise
export const pill = (active) =>
  `rounded-full px-3.5 py-2 text-[13px] leading-4 font-medium transition-colors duration-150 ease-soft ${active ? "bg-brand text-white" : "border border-gray-300 bg-white text-ink"}`;
