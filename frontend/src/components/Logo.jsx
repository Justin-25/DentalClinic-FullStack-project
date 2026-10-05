import { Link } from "react-router";
import mark from "../assets/logo-mark.svg";
import markInverse from "../assets/logo-mark-inverse.svg";

export default function Logo({ inverse = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src={inverse ? markInverse : mark} alt="" className="h-9 w-auto" />
      <span className="flex flex-col leading-none">
        <span
          className={`text-lg font-bold ${inverse ? "text-white" : "text-ink"}`}
        >
          Tooth Fairy
        </span>
        <span
          className={`text-[9px] font-semibold tracking-[0.28em] ${inverse ? "text-gray-400" : "text-brand-logo"}`}
        >
          DENTISTRY
        </span>
      </span>
    </Link>
  );
}
