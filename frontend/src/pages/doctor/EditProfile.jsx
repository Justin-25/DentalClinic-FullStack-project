import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import DoctorCard from "../../components/DoctorCard";
import TextField from "../../components/TextField";
import { primaryBtn } from "../../components/booking/buttonStyles";

const BIO_MAX = 500; // the User model's bio maxlength

// the saved profile as form values (inputs hold strings)
const toForm = (user) => ({
  name: user.name,
  specialization: user.specialization ?? "",
  years: user.yearsOfExperience != null ? String(user.yearsOfExperience) : "",
  bio: user.bio ?? "",
});

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  const years = Number(form.years);
  if (form.years !== "" && !(Number.isInteger(years) && years >= 0 && years <= 70)) {
    errors.years = "Enter a whole number from 0 to 70.";
  }
  return errors;
}

// The doctor's public profile: what patients see on Doctors and on the doctor's page.
export default function EditProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef(null);
  const bioId = useId();
  const previewId = useId();

  const [form, setForm] = useState(() => toForm(user));
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // only for the rating on the preview card (same key and shape as the public doctor page)
  const doctorQ = useQuery({
    queryKey: ["doctor", user._id],
    queryFn: () => api(`/doctors/${user._id}`),
  });

  const saveM = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("specialization", form.specialization.trim());
      body.append("yearsOfExperience", form.years);
      body.append("bio", form.bio.trim());
      if (photoFile) body.append("photo", photoFile);
      return api("/users/myAccount", { method: "PATCH", body });
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["me"], { data: { user: res.data.user } });
      setForm(toForm(res.data.user)); // the trimmed values the server kept
      setPhotoFile(null);
      // the public pages show the new profile
      queryClient.invalidateQueries({ queryKey: ["doctor", user._id] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });

  const saved = toForm(user);
  const changed =
    photoFile !== null || Object.keys(saved).some((key) => form[key] !== saved[key]);

  function set(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((errs) => ({ ...errs, [key]: undefined }));
    };
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) saveM.mutate();
  }

  const doctor = doctorQ.data?.data.doctor;

  return (
    <div className="space-y-5 lg:space-y-6">
      <h1 className="text-[22px] font-bold text-ink lg:text-[32px]">Your public profile</h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="min-w-0 space-y-4 lg:flex-1 lg:rounded-xl lg:border lg:border-gray-300 lg:bg-white lg:p-6"
        >
          <div className="flex items-center gap-3.5">
            <img
              src={preview ?? `/img/users/${user.photo}`}
              alt=""
              className="size-18 shrink-0 rounded-full bg-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={() => fileInput.current.click()}
              className="text-sm font-semibold text-brand transition-colors duration-150 ease-soft hover:text-brand-dark"
            >
              Change photo
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="hidden"
            />
          </div>

          <TextField
            label="Full name"
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
          />
          <TextField
            label="Specialization"
            placeholder="General Dentist"
            value={form.specialization}
            onChange={set("specialization")}
          />
          <TextField
            label="Years of experience"
            type="number"
            inputMode="numeric"
            min={0}
            max={70}
            value={form.years}
            onChange={set("years")}
            error={errors.years}
          />

          <div className="space-y-1.5">
            <label htmlFor={bioId} className="block text-[13px] font-medium text-ink">
              Bio
            </label>
            <textarea
              id={bioId}
              value={form.bio}
              onChange={set("bio")}
              maxLength={BIO_MAX}
              placeholder="Tell patients about your experience and approach."
              className="h-27.5 w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors duration-150 ease-soft placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="text-[12px] text-gray-500">
              {form.bio.length} / {BIO_MAX}
            </p>
          </div>

          {saveM.isError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-800"
            >
              <FaCircleExclamation aria-hidden="true" className="mt-0.5 shrink-0" />
              {saveM.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={!changed || saveM.isPending}
            className={`${primaryBtn} lg:w-fit`}
          >
            {saveM.isPending ? "Saving..." : "Save profile"}
          </button>

          {saveM.isSuccess && !changed && (
            <p role="status" className="text-[13px] font-medium text-[#1E6B34]">
              Profile saved.
            </p>
          )}
        </form>

        {/* desktop only: the public Doctors card, live with what's typed */}
        <section aria-labelledby={previewId} className="hidden space-y-3 lg:block lg:w-97.5 lg:shrink-0">
          <h2 id={previewId} className="text-sm font-semibold text-gray-500">
            How patients see you
          </h2>
          <div className="rounded-xl border border-gray-300 bg-white p-4">
            <DoctorCard
              name={form.name.trim() || user.name}
              photo={user.photo}
              photoUrl={preview ?? undefined}
              specialization={form.specialization.trim()}
              yearsOfExperience={Number(form.years) || 0}
              ratingAverage={doctor?.ratingAverage}
              ratingCount={doctor?.ratingCount ?? 0}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
