import { useEffect, useId, useRef } from "react";
import { FaCircleExclamation } from "react-icons/fa6";

// Native <dialog>: showModal() traps focus, makes the page behind it inert, and handles Esc.
// Put the safest action first in `actions` so it receives focus when the modal opens.
export default function Modal({ open, title, tone, onClose, actions, children }) {
  const ref = useRef(null);
  const id = useId();

  // showModal()/close() are browser methods, so `open` is synced to the element in an effect
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      // React state decides when it closes, so stop the browser closing it on Esc by itself
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // a click on the dialog itself (not the content inside it) is a click on the backdrop
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="modal m-auto w-[calc(100%-40px)] max-w-110 rounded-2xl bg-white"
    >
      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <h2
            id={`${id}-title`}
            className="flex items-start gap-2.5 text-lg font-bold text-ink"
          >
            {tone === "error" && (
              <FaCircleExclamation
                aria-hidden="true"
                className="mt-1 shrink-0 text-[#A12B2B]"
              />
            )}
            {title}
          </h2>
          <div id={`${id}-body`} className="text-sm text-gray-500">
            {children}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row">
          {actions}
        </div>
      </div>
    </dialog>
  );
}
