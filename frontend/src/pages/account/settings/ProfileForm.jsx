import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaCircleExclamation } from "react-icons/fa6";
import { api } from "../../../api/client";
import { useAuth } from "../../../auth/AuthContext";
import TextField from "../../../components/TextField";
import { primaryBtn } from "../../../components/booking/buttonStyles";

export default function ProfileForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef(null);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const saveM = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("email", email.trim());
      if (photoFile) form.append("photo", photoFile);
      return api("/users/myAccount", {
        method: "PATCH",
        body: form,
      });
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["me"], {
        data: { user: res.data.user },
      });
      setPhotoFile(null);
    },
  });

  function handlePhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  const changed =
    name !== user.name || email !== user.email || photoFile !== null;

  function handleSubmit(e) {
    e.preventDefault();
    saveM.mutate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 lg:rounded-xl lg:border lg:border-gray-300 lg:bg-white lg:p-6"
    >
      <h2 className="hidden text-xl font-bold text-ink lg:block">Profile</h2>

      <div className="flex items-center gap-3.5">
        <img
          src={preview ?? `/img/users/${user.photo}`}
          alt=""
          className="size-16 shrink-0 rounded-full bg-gray-200 object-cover lg:size-18"
        />
        <button
          type="button"
          onClick={() => fileInput.current.click()}
          className="text-[13px] font-semibold text-brand md:text-sm"
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
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {saveM.error && (
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
        {saveM.isPending ? "Saving..." : "Save changes"}
      </button>

      {saveM.isSuccess && !changed && (
        <p role="status" className="text-[13px] font-medium text-[#1E6B34]">
          Profile updated.
        </p>
      )}
    </form>
  );
}
