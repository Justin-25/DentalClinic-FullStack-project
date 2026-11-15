// What an admin can do next, per status. Mirrors ALLOWED_TRANSITIONS on the backend;
// unlike doctors, admins can also cancel.
export const ADMIN_ACTIONS = {
  pending: [
    { status: "confirmed", label: "Confirm" },
    { status: "cancelled", label: "Cancel appointment" },
  ],
  confirmed: [
    { status: "completed", label: "Mark completed" },
    { status: "no-show", label: "Mark no-show" },
    { status: "cancelled", label: "Cancel appointment" },
  ],
};

// the Modal's title and confirm button for each new status
export const CONFIRM = {
  confirmed: { title: (name) => `Confirm ${name}'s appointment?`, button: "Confirm" },
  completed: { title: (name) => `Mark ${name}'s visit as completed?`, button: "Complete" },
  "no-show": { title: (name) => `Mark ${name} as a no-show?`, button: "No-show" },
  cancelled: { title: (name) => `Cancel ${name}'s appointment?`, button: "Yes, cancel" },
};
