import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import { dangerBtn, primaryBtn, secondaryBtn } from "../../components/booking/buttonStyles";
import { cardClass, rowClass, tableBox, td, textLink, th, theadClass } from "./adminUi";
import { priceLabel } from "./services";

const tag = "inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold";
const outlineTag = "inline-block rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-[12px] font-medium text-ink";

function StatusTag({ active }) {
  return active ? (
    <span className={`${tag} bg-[#E6F4EA] text-[#1E6B34]`}>Active</span>
  ) : (
    <span className={`${tag} bg-[#FDECEC] text-[#A12B2B]`}>Deleted</span>
  );
}

const visibility = (s) => (s.secretService ? "Unlisted" : "Public");

// The whole catalog, unlisted and deleted services included.
export default function AdminServices() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(null);

  const servicesQ = useQuery({ queryKey: ["services", "admin"], queryFn: () => api("/services/admin") });

  // the public catalog, service pages and booking read these too
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["services"] }),
      queryClient.invalidateQueries({ queryKey: ["service"] }),
    ]);

  const deleteM = useMutation({
    mutationFn: (s) => api(`/services/${s._id}`, { method: "DELETE" }),
    onSuccess: () => setDeleting(null),
    onSettled: refresh,
  });
  const restoreM = useMutation({
    mutationFn: (s) => api(`/services/admin/restore/${s._id}`, { method: "PATCH" }),
    onSettled: refresh,
  });

  // "Copy link" for unlisted services: the page patients open (and book from) by direct link
  const [copied, setCopied] = useState(null); // { id, ok, url }
  async function copyLink(s) {
    const url = `${window.location.origin}/services/${s.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied({ id: s._id, ok: true, url });
    } catch {
      setCopied({ id: s._id, ok: false, url }); // no clipboard access: show the link to copy by hand
    }
  }

  function askDelete(s) {
    deleteM.reset();
    setDeleting(s);
  }
  function closeDelete() {
    if (!deleteM.isPending) setDeleting(null);
  }

  // active ones first, then by name
  const services = [...(servicesQ.data?.data.services ?? [])].sort(
    (a, b) => Number(b.active !== false) - Number(a.active !== false) || a.name.localeCompare(b.name),
  );

  const actions = (s) =>
    s.active === false ? (
      <button type="button" onClick={() => restoreM.mutate(s)} disabled={restoreM.isPending} aria-label={`Restore ${s.name}`} className={textLink}>
        Restore
      </button>
    ) : (
      <span className="whitespace-nowrap">
        <Link to={`/admin/services/${s._id}/edit`} aria-label={`Edit ${s.name}`} className={textLink}>
          Edit
        </Link>
        <span className="px-1.5 text-gray-400" aria-hidden="true">·</span>
        <button type="button" onClick={() => askDelete(s)} aria-label={`Delete ${s.name}`} className={textLink}>
          Delete
        </button>
        {s.secretService && (
          <>
            <span className="px-1.5 text-gray-400" aria-hidden="true">·</span>
            <button type="button" onClick={() => copyLink(s)} aria-label={`Copy link to ${s.name}`} className={textLink}>
              Copy link
            </button>
          </>
        )}
      </span>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-ink lg:text-[32px]">Services</h1>
          <p className="hidden text-[13px] text-gray-500 lg:block">The treatment catalog patients book from</p>
        </div>
        {/* the wrapper sizes to the button's text (the button style itself is full width) */}
        <div className="shrink-0">
          <Link to="/admin/services/new" className={primaryBtn}>
            <span className="lg:hidden">+ New</span>
            <span className="hidden lg:inline">+ New service</span>
          </Link>
        </div>
      </div>

      {copied && (
        <p role="status" className="break-all rounded-lg bg-gray-100 px-3.5 py-3 text-[13px] font-medium text-ink">
          {copied.ok ? "Link copied: " : "Copy this link: "}
          <span className="font-normal text-gray-500">{copied.url}</span>
        </p>
      )}

      {restoreM.isError && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800">
          <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
          {restoreM.error.message}
        </p>
      )}

      {servicesQ.isPending && <p className="text-sm text-gray-500">Loading services...</p>}
      {servicesQ.isError && <p className="text-sm text-gray-500">We couldn't load the services. Please try again.</p>}
      {servicesQ.isSuccess && services.length === 0 && <p className="text-sm text-gray-500">No services yet.</p>}

      {services.length > 0 && (
        <>
          <div className={tableBox}>
            <table className="w-full text-left text-sm text-ink">
              <thead className={theadClass}>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Category</th>
                  <th className={th}>Price</th>
                  <th className={th}>Duration</th>
                  <th className={th}>Visibility</th>
                  <th className={th}>Status</th>
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id} className={rowClass}>
                    <td className={`${td} font-semibold`}>{s.name}</td>
                    <td className={td}>{s.category}</td>
                    <td className={`${td} whitespace-nowrap`}>{priceLabel(s)}</td>
                    <td className={`${td} whitespace-nowrap`}>{s.duration} min</td>
                    <td className={td}>
                      <span className={outlineTag}>{visibility(s)}</span>
                    </td>
                    <td className={td}>
                      <StatusTag active={s.active !== false} />
                    </td>
                    <td className={td}>{actions(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {services.map((s) => (
              <li key={s._id} className={`${cardClass} space-y-1`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">{s.name}</p>
                  <StatusTag active={s.active !== false} />
                </div>
                <p className="text-[13px] text-gray-500">{s.category}</p>
                <p className="text-[13px] text-gray-500">
                  {priceLabel(s)} · {s.duration} min · {visibility(s)}
                </p>
                <div className="pt-0.5">{actions(s)}</div>
              </li>
            ))}
          </ul>

          <p className="text-[12px] text-gray-500">
            Unlisted = hidden from the public catalog, but anyone with its link can view and book it (use Copy link).
            Deleted = hidden everywhere until restored.
          </p>
        </>
      )}

      <Modal
        open={deleting !== null}
        tone={deleteM.isError ? "error" : undefined}
        title={deleteM.isError ? "We couldn't delete this service" : deleting && `Delete ${deleting.name}?`}
        onClose={closeDelete}
        actions={
          deleteM.isError ? (
            <button type="button" onClick={closeDelete} className={secondaryBtn}>
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleteM.isPending}
                className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Not now
              </button>
              <button type="button" onClick={() => deleteM.mutate(deleting)} disabled={deleteM.isPending} className={dangerBtn}>
                {deleteM.isPending ? "Deleting..." : "Delete"}
              </button>
            </>
          )
        }
      >
        {deleteM.isError
          ? deleteM.error.message
          : "Patients won't see or book it. Existing appointments stay, and you can restore it later."}
      </Modal>
    </div>
  );
}
