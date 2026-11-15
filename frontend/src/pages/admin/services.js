// the Service model's category enum
export const CATEGORIES = [
  "Preventive & Diagnostic",
  "Restorative",
  "Surgical & Specialized",
  "Cosmetic",
  "Emergency & Urgent Care",
  "Consultation",
];

// "$80", or "$250 (was $300)" when there's a sale price
export const priceLabel = (s) => (s.priceDiscount != null ? `$${s.priceDiscount} (was $${s.price})` : `$${s.price}`);

export const UNLISTED_HELP = "Hidden from the catalog and booking. Its page still opens from a direct link.";
