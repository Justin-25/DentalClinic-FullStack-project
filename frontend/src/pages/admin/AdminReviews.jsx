import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import Stars from "../../components/Stars";
import { dangerBtn, secondaryBtn } from "../../components/booking/buttonStyles";
import { formatMonthDay } from "../../utils/format";
import { cardClass, FilterSelect, Pager, rowClass, tableBox, td, textLink, th, theadClass } from "./adminUi";
import { pill } from "./adminStyles";

const PAGE_SIZE = 10;
const TYPES = [
  ["", "All"],
  ["clinic", "Clinic"],
  ["doctor", "Dentist"],
];

// "Elena Reyes" -> "Elena R." (as on the public pages: no full names)
function shortName(name = "") {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
}

const about = (r) => (r.type === "clinic" ? "Clinic" : (r.doctor?.name ?? "Dentist"));
const dateOf = (r) => formatMonthDay(r.createdAt.slice(0, 10));

// Remove spam or abusive reviews. The server filters and pages; deleting is permanent.
export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [type, setType] = useState("");
  const [doctor, setDoctor] = useState("");
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState(null);

  const params = new URLSearchParams({ page, limit: PAGE_SIZE });
  if (type) params.set("type", type);
  if (doctor && type !== "clinic") params.set("doctor", doctor);

  const reviewsQ = useQuery({
    queryKey: ["reviews", "admin", type, doctor, page],
    queryFn: () => api(`/reviews?${params}`),
    placeholderData: keepPreviousData, // keep the table while the next page loads
  });
  const doctorsQ = useQuery({ queryKey: ["doctors"], queryFn: () => api("/doctors") });

  const reviews = reviewsQ.data?.data.reviews ?? [];
  const pagination = reviewsQ.data?.pagination;

  const removeM = useMutation({
    mutationFn: (r) => api(`/reviews/${r._id}`, { method: "DELETE" }),
    onSuccess: () => {
      setRemoving(null);
      // the last review on a later page: step back a page
      if (reviews.length === 1 && page > 1) setPage(page - 1);
    },
    // public review lists, the clinic summary and dentists' ratings change too
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["doctors"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor"] }),
      ]),
  });

  function askRemove(r) {
    removeM.reset();
    setRemoving(r);
  }
  function closeRemove() {
    if (!removeM.isPending) setRemoving(null);
  }

  const pickType = (value) => {
    setType(value);
    setPage(1);
  };
  const pickDoctor = (value) => {
    setDoctor(value);
    setPage(1);
  };

  const doctorOptions = [["", "All dentists"], ...(doctorsQ.data?.data.doctors ?? []).map((d) => [d._id, d.name])];

  const removeButton = (r) => (
    <button type="button" onClick={() => askRemove(r)} aria-label={`Remove review by ${shortName(r.patient?.name)}`} className={textLink}>
      Remove
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold text-ink lg:text-[32px]">Reviews</h1>
        <p className="text-[13px] text-gray-500">Remove spam or abusive reviews</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex gap-2" role="group" aria-label="Review type">
          {TYPES.map(([value, label]) => (
            <button key={label} type="button" aria-pressed={type === value} onClick={() => pickType(value)} className={pill(type === value)}>
              {label}
            </button>
          ))}
        </div>
        <fieldset disabled={type === "clinic"} className="lg:w-56">
          <FilterSelect label="Dentist" value={type === "clinic" ? "" : doctor} onChange={pickDoctor} options={doctorOptions} />
        </fieldset>
      </div>

      {reviewsQ.isPending && <p className="text-sm text-gray-500">Loading reviews...</p>}
      {reviewsQ.isError && <p className="text-sm text-gray-500">We couldn't load the reviews. Please try again.</p>}
      {reviewsQ.isSuccess && reviews.length === 0 && <p className="text-sm text-gray-500">No reviews here.</p>}

      {reviews.length > 0 && (
        <>
          <div className={tableBox}>
            <table className="w-full text-left text-sm text-ink">
              <thead className={theadClass}>
                <tr>
                  <th className={th}>Rating</th>
                  <th className={th}>Type</th>
                  <th className={th}>Review</th>
                  <th className={th}>By</th>
                  <th className={th}>Date</th>
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id} className={`${rowClass} align-top`}>
                    <td className={`${td} whitespace-nowrap`}>
                      <Stars rating={r.rating} />
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{about(r)}</td>
                    <td className={`${td} break-words`}>“{r.review}”</td>
                    <td className={`${td} whitespace-nowrap`}>{shortName(r.patient?.name)}</td>
                    <td className={`${td} whitespace-nowrap`}>{dateOf(r)}</td>
                    <td className={td}>{removeButton(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {reviews.map((r) => (
              <li key={r._id} className={`${cardClass} space-y-1.5`}>
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={r.rating} />
                  <span className="text-[12px] text-gray-500">{dateOf(r)}</span>
                </div>
                <p className="break-words text-sm text-ink">“{r.review}”</p>
                <p className="text-[13px] text-gray-500">
                  {shortName(r.patient?.name)} · {about(r)}
                </p>
                {removeButton(r)}
              </li>
            ))}
          </ul>

          {pagination && (
            <Pager
              summary={`Page ${pagination.page} of ${pagination.totalPages} · ${pagination.totalResults} review${pagination.totalResults === 1 ? "" : "s"}`}
              page={pagination.page}
              pageCount={pagination.totalPages}
              onPage={setPage}
            />
          )}
        </>
      )}

      <Modal
        open={removing !== null}
        tone={removeM.isError ? "error" : undefined}
        title={removeM.isError ? "We couldn't remove this review" : "Remove this review?"}
        onClose={closeRemove}
        actions={
          removeM.isError ? (
            <button type="button" onClick={closeRemove} className={secondaryBtn}>
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={closeRemove}
                disabled={removeM.isPending}
                className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Not now
              </button>
              <button type="button" onClick={() => removeM.mutate(removing)} disabled={removeM.isPending} className={dangerBtn}>
                {removeM.isPending ? "Removing..." : "Remove"}
              </button>
            </>
          )
        }
      >
        {removeM.isError
          ? removeM.error.message
          : removing && `${shortName(removing.patient?.name)}'s review disappears from the site for good. This can't be undone.`}
      </Modal>
    </div>
  );
}
