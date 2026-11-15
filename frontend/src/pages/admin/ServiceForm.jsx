import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeftLong, FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../api/client";
import TextField from "../../components/TextField";
import { primaryBtn, secondaryBtn } from "../../components/booking/buttonStyles";
import { FilterSelect } from "./adminUi";
import { CATEGORIES, UNLISTED_HELP } from "./services";

const CATEGORY_OPTIONS = [["", "Choose a category"], ...CATEGORIES.map((c) => [c, c])];

const toForm = (s) => ({
  name: s?.name ?? "",
  category: s?.category ?? "",
  summary: s?.summary ?? "",
  price: s?.price != null ? String(s.price) : "",
  sale: s?.priceDiscount != null ? String(s.priceDiscount) : "",
  duration: s?.duration != null ? String(s.duration) : "",
  secret: s?.secretService ?? false,
});

// the same rules as the Service model, checked before sending
function validate(f) {
  const errors = {};
  const price = Number(f.price);
  const sale = Number(f.sale);
  const duration = Number(f.duration);
  if (!f.name.trim()) errors.name = "Enter a name.";
  if (!f.category) errors.category = "Choose a category.";
  if (!f.summary.trim()) errors.summary = "Enter a summary.";
  if (f.price === "" || !(price > 0)) errors.price = "Enter a price.";
  if (f.sale !== "" && !(sale >= 0)) errors.sale = "Enter a valid sale price.";
  else if (f.sale !== "" && !errors.price && sale >= price) errors.sale = "Sale price must be lower than the regular price.";
  if (f.duration === "" || !(Number.isInteger(duration) && duration > 0 && duration <= 480)) {
    errors.duration = "Enter 1–480 minutes.";
  }
  return errors;
}

function ServiceEditor({ service }) {
  const editing = Boolean(service);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInput = useRef(null);
  const summaryId = useId();
  const unlistedId = useId();

  const [form, setForm] = useState(() => toForm(service));
  const [errors, setErrors] = useState({});
  const [cover, setCover] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const saveM = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("category", form.category);
      body.append("summary", form.summary.trim());
      body.append("price", form.price);
      body.append("priceDiscount", form.sale); // "" clears a sale price
      body.append("duration", form.duration);
      body.append("secretService", String(form.secret));
      if (cover) body.append("imageCover", cover);
      return editing
        ? api(`/services/${service._id}`, { method: "PATCH", body })
        : api("/services", { method: "POST", body });
    },
    onSuccess: async () => {
      // the admin list, the public catalog, service pages and booking
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["services"] }),
        queryClient.invalidateQueries({ queryKey: ["service"] }),
      ]);
      navigate("/admin/services");
    },
  });

  function set(key) {
    return (value) => {
      setForm((f) => ({ ...f, [key]: value }));
      setErrors((e) => ({ ...e, [key]: undefined }));
    };
  }
  const fromInput = (key) => (e) => set(key)(e.target.value);

  function handleCover(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setCover(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) saveM.mutate();
  }

  const coverSrc = preview ?? (service ? `/img/services/${service.imageCover}` : null);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <div className="min-w-0 space-y-4 lg:flex-1 lg:rounded-xl lg:border lg:border-gray-300 lg:bg-white lg:p-6">
        <TextField label="Name" placeholder="e.g. Teeth Whitening" value={form.name} onChange={fromInput("name")} error={errors.name} />
        <FilterSelect label="Category" value={form.category} onChange={set("category")} options={CATEGORY_OPTIONS} error={errors.category} />

        <div className="space-y-1.5">
          <label htmlFor={summaryId} className="block text-[13px] font-medium text-ink">
            Summary
          </label>
          <textarea
            id={summaryId}
            value={form.summary}
            onChange={fromInput("summary")}
            placeholder="One or two sentences patients see on the card."
            aria-invalid={!!errors.summary}
            aria-describedby={errors.summary ? `${summaryId}-error` : undefined}
            className={`h-24 w-full resize-none rounded-lg border bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:ring-2 ${errors.summary ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:border-brand focus:ring-brand/20"}`}
          />
          {errors.summary && (
            <p id={`${summaryId}-error`} className="text-[12px] font-medium text-red-700">
              {errors.summary}
            </p>
          )}
        </div>

        {/* items-end: the longer "Sale price" label wraps, so line the inputs up at the bottom */}
        <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <TextField label="Price ($)" type="number" inputMode="decimal" min={0} placeholder="250" value={form.price} onChange={fromInput("price")} error={errors.price} />
          <TextField label="Sale price ($, optional)" type="number" inputMode="decimal" min={0} value={form.sale} onChange={fromInput("sale")} error={errors.sale} />
          <TextField label="Duration (min)" type="number" inputMode="numeric" min={1} placeholder="90" value={form.duration} onChange={fromInput("duration")} error={errors.duration} />
        </div>

        <div className="flex items-center gap-4 rounded-[10px] bg-gray-100 p-4">
          {coverSrc ? (
            <img src={coverSrc} alt="" className="h-14 w-20 shrink-0 rounded-md bg-gray-200 object-cover" />
          ) : (
            <div className="h-14 w-20 shrink-0 rounded-md bg-gray-200" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Cover image</p>
            <p className="text-[12px] text-gray-500">JPG or PNG</p>
          </div>
          <button
            type="button"
            onClick={() => fileInput.current.click()}
            className="shrink-0 text-[13px] font-semibold text-brand transition-colors duration-150 ease-soft hover:text-brand-dark"
          >
            {coverSrc ? "Change image" : "Choose image"}
          </button>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png" onChange={handleCover} className="hidden" />
        </div>

        {saveM.isError && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800">
            <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
            {saveM.error.message}
          </p>
        )}
      </div>

      <div className="w-full space-y-3 lg:w-85 lg:shrink-0">
        <section className="space-y-2 rounded-xl bg-gray-100 p-5">
          <h2 className="text-base font-bold text-ink">Visibility</h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p id={unlistedId} className="text-sm font-semibold text-ink">
                Unlisted
              </p>
              <p className="text-[12px] text-gray-500">{UNLISTED_HELP}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.secret}
              aria-labelledby={unlistedId}
              onClick={() => set("secret")(!form.secret)}
              className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors duration-150 ease-soft ${form.secret ? "bg-brand" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-150 ease-soft ${form.secret ? "translate-x-4" : ""}`}
              />
            </button>
          </div>
        </section>

        <button type="submit" disabled={saveM.isPending} className={primaryBtn}>
          {saveM.isPending ? "Saving..." : editing ? "Save changes" : "Create service"}
        </button>
        <Link to="/admin/services" className={secondaryBtn}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

// /admin/services/new and /admin/services/:serviceId/edit
export default function ServiceForm() {
  const { serviceId } = useParams();

  const serviceQ = useQuery({
    queryKey: ["services", "admin", serviceId],
    queryFn: () => api(`/services/admin/${serviceId}`),
    enabled: Boolean(serviceId),
  });

  let body;
  if (!serviceId) body = <ServiceEditor />;
  else if (serviceQ.isPending) body = <p className="text-sm text-gray-500">Loading service...</p>;
  else if (serviceQ.isError) body = <p className="text-sm text-gray-500">We couldn't find this service.</p>;
  else body = <ServiceEditor key={serviceId} service={serviceQ.data.data.service} />;

  return (
    <div className="space-y-5">
      <Link
        to="/admin/services"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand md:text-sm"
      >
        <FaArrowLeftLong aria-hidden="true" /> Services
      </Link>
      <h1 className="text-2xl font-bold text-ink md:text-[32px]">{serviceId ? "Edit service" : "New service"}</h1>
      {body}
    </div>
  );
}
