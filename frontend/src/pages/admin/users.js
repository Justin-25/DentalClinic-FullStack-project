export const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", admin: "Admin" };

// MongoDB ids start with their creation time (seconds, hex), so they double as a join date.
export function joinedOn(id) {
  const seconds = parseInt(id.slice(0, 8), 16);
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
