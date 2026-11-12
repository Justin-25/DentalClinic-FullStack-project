import {
  primaryBtn,
  secondaryBtn,
} from "../../components/booking/buttonStyles";
import { NEXT_ACTIONS } from "./doctorActions";

// The button a visit's status allows. Clicking one doesn't save anything: it asks the page to open the Modal.
export default function ActionButtons({ appointment, onAction }) {
  const actions = NEXT_ACTIONS[appointment.status] ?? [];

  return (
    <div className="flex gap-2">
      {actions.map((action, i) => (
        <button
          key={action.status}
          type="button"
          onClick={() => onAction(appointment, action)}
          className={`${i === 0 ? primaryBtn : secondaryBtn} flex-1 lg:w-fit lg:flex-none`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
