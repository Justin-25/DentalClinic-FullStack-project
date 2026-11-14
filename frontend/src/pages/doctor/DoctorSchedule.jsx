import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { primaryBtn } from "../../components/booking/buttonStyles";
import DayRow from "./DayRow";
import DaysOff from "./DaysOff";
import { normalize, toDraft, WEEKDAYS } from "./schedule";

export default function DoctorSchedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // null = no unsaved edits: show what the server has
  const [draft, setDraft] = useState(null);
  const queryKey = ["schedule", user._id];

  const scheduleQ = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const res = await api(`/schedules/${user._id}`);
        return res.data.schedule;
      } catch (err) {
        if (err.status === 404) return null;
        throw err;
      }
    },
  });

  const saveM = useMutation({
    mutationFn: (body) =>
      api("/schedules/mySchedule", {
        method: "PATCH",
        body,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKey, res.data.schedule);
      setDraft(null);
    },
  });

  if (scheduleQ.isPending) {
    return <p className="text-sm text-gray-500">Loading schedule...</p>;
  }
  if (scheduleQ.isError) {
    return (
      <p className="text-sm text-gray-500">
        We couldn't load your schedule. Please try again.
      </p>
    );
  }

  const saved = toDraft(scheduleQ.data);
  const current = draft ?? saved;
  const changed =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const canSave = changed && !saveM.isPending;
  const saveLabel = saveM.isPending ? "Saving..." : "Save schedule";

  function update(changes) {
    setDraft(normalize({ ...current, ...changes }));
  }

  function setDayBlocks(day, blocks) {
    update({
      weeklyAvailability: [
        ...current.weeklyAvailability.filter((b) => b.day !== day),
        ...blocks,
      ],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="contents lg:flex lg:items-center lg:justify-between">
        <h1 className="sr-only lg:not-sr-only lg:text-[32px] lg:font-bold lg:text-ink">
          Schedule
        </h1>
        <div className="hidden lg:block">
          <button
            type="button"
            onClick={() => saveM.mutate(current)}
            disabled={!canSave}
            className={`${primaryBtn} w-fit`}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      <div className="order-last empty:hidden lg:order-0">
        {saveM.isError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
          >
            <FaCircleExclamation
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            {saveM.error.message}
          </p>
        )}
        {saveM.isSuccess && !changed && (
          <p role="status" className="text-[13px] font-medium text-[#1E6B34]">
            Schedule saved.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <section className="min-w-0 lg:flex-1 lg:rounded-xl lg:border lg:border-gray-300 lg:bg-white lg:px-6 lg:py-2">
          <div className="space-y-0.5 pb-1 lg:py-3">
            <h2 className="text-[22px] font-bold text-ink lg:text-xl">
              Weekly hours
            </h2>
            <p className="text-[13px] text-gray-500">
              Patients can only book inside these hours.
            </p>
          </div>
          <ul>
            {WEEKDAYS.map((day) => (
              <DayRow
                key={day}
                day={day}
                blocks={current.weeklyAvailability.filter((b) => b.day === day)}
                onChange={(blocks) => setDayBlocks(day, blocks)}
              />
            ))}
          </ul>
        </section>

        <DaysOff
          daysOff={current.exceptions}
          onChange={(exceptions) => update({ exceptions })}
        />
      </div>

      <button
        type="button"
        onClick={() => saveM.mutate(current)}
        disabled={!canSave}
        className={`${primaryBtn} order-last lg:hidden`}
      >
        {saveLabel}
      </button>
    </div>
  );
}
