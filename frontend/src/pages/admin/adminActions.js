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

// every status, for "Correct status": admins may set any of them to fix a mistake
export const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
};

// after any status change: this page, the admin list, the doctor's and patient's lists;
// a cancel frees the slot (and un-cancelling takes it again)
export const refreshAfterStatusChange = (queryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    queryClient.invalidateQueries({ queryKey: ["availability"] }),
  ]);

// the Modal's title and confirm button for each new status
export const CONFIRM = {
  confirmed: { title: (name) => `Confirm ${name}'s appointment?`, button: "Confirm" },
  completed: { title: (name) => `Mark ${name}'s visit as completed?`, button: "Complete" },
  "no-show": { title: (name) => `Mark ${name} as a no-show?`, button: "No-show" },
  cancelled: { title: (name) => `Cancel ${name}'s appointment?`, button: "Yes, cancel" },
};
