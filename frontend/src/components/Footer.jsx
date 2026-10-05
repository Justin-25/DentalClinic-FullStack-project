import { Link } from "react-router";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-footer text-gray-400">
      <div className="mx-auto max-w-6xl px-5 py-14">
        {/* Top row: brand on the left, three columns on the right */}
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-xs space-y-3.5">
            <Logo inverse />
            <p className="text-sm">
              Gentle, modern dental care for the whole family - from first
              check-ups to brighter smiles.
            </p>
          </div>

          {/* Columnn 1: Clinic (real links) */}
          <div className="space-y-2.5 text-sm">
            <h3 className="font-semibold text-white">Clinic</h3>
            <Link to="/services" className="block hover:text-white">
              Services
            </Link>
            <Link to="/doctors" className="block hover:text-white">
              Our dentists
            </Link>
            <Link to="/book" className="block hover:text-white">
              Book an appointment
            </Link>
          </div>

          {/* Column 2: Visit us (plain text) */}
          <div className="space-y-2.5 text-sm">
            <h3 className="font-semibold text-white">Visit us</h3>
            <p>123 Smile Avenue, Springfield</p>
            <p>Mon-Fri · 9:00 AM - 5:00 PM</p>
            <p>Sat · 9:00 AM - 1:00 PM</p>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-2.5 text-sm">
            <h3 className="font-semibold text-white">Contact</h3>
            <a href="tel:5550123456" className="block hover:text-white">
              (555) 012-3456
            </a>
            <a
              href="mailto:hello@toothfairy.com"
              className="block hover:text-white"
            >
              hello@toothfairy.com
            </a>
          </div>
        </div>

        {/* Devider */}
        <hr className="my-8 border-gray-700" />
        {/* Bottom row */}
        <div className="flex flex-col gap-2 text-sm md:flex-row md:justify-between">
          <p>&copy; {new Date().getFullYear()} Tooth Fairy Dentistry</p>
          <p>Portfolio project - not a real clinic</p>
        </div>
      </div>
    </footer>
  );
}
