import { ROLE_LABEL } from "./users";

export function RoleTag({ role }) {
  return (
    <span className="inline-block rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-[12px] font-medium text-ink">
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

export function DeactivatedTag() {
  return (
    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[12px] font-semibold text-gray-500">
      Deactivated
    </span>
  );
}
