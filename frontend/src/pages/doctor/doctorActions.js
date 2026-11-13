
// What a doctor can do next, per status. Mirrors ALLOWED
export const NEXT_ACTIONS = {
  pending: [{ status: "confirmed", label: "Confirm", longLabel: "Confirm" }],
  confirmed: [
    { status: "completed", label: "Complete", longLabel: "Mark completed" },
    { status: "no-show", label: "No-show", longLabel: "Mark no-show" },
  ],
};

// Modal title for each new status
export const CONFIRM_TITLE = {
  confirmed: (name) => `Confirm ${name}'s appointment?`,
  completed: (name) => `Mark ${name}'s visit as completed?`,
  "no-show": (name) => `Mark ${name} as a no-show?`,
};