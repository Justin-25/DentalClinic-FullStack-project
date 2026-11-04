const STYLES = {
  pending: ["Pending", "bg-[#FDF3DC] text-[#8A5A00]"],
  confirmed: ["Confirmed", "bg-[#E3F1F2] text-[#13626A]"],
  completed: ["Completed", "bg-[#E6F4EA] text-[#1E6B34]"],
  cancelled: ["Cancelled", "bg-[#FDECEC] text-[#A12B2B]"],
  "no-show": ["No-show", "bg-gray-100 text-gray-500"],
};

export default function StatusBadge({ status }) {
  const [label, colors] = STYLES[status];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[12px] font-semibold ${colors}`}
    >
      {label}
    </span>
  );
}
