import { formatTimeSpan } from "../../utils/format";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// "HH:mm" with two-digit hours: the server's format, and what makes text comparison work
export const DEFAULT_HOURS = { startTime: "09:00", endTime: "17:00" };

const byDayThenStart = (a, b) =>
  WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime);

export function normalize(draft) {
  return {
    weeklyAvailability: [...draft.weeklyAvailability].sort(byDayThenStart),
    exceptions: [...draft.exceptions].sort((a, b) => a.date.localeCompare(b.date)), 
  };
}

export function toDraft(schedule) {
  return normalize({
    weeklyAvailability: (schedule?.weeklyAvailability ?? []).map(({ day, startTime, endTime }) => ({
      day,
      startTime,
      endTime
    })),
    exceptions: (schedule?.exceptions ?? []).map((ex) => ({
      date: ex.date.slice(0, 10),
      reason: ex.reason ?? "",
    }))
  })
}

export function blockError(blocks, start, end) {
  if (!start || !end) return "Enter a start and an end time.";
  if (start >= end) return "End time must be after start time.";
  const clash = blocks.find((b) => start < b.endTime && b.startTime < end );
  return clash ? `Overlaps ${formatTimeSpan(clash.startTime, clash.endTime)}.` : null
}