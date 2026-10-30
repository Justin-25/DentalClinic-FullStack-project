// mobile only: actions pinned to the bottom (the summary panel holds them on desktop)
export default function MobileBar({ children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 space-y-2.5 border-t border-gray-300 bg-white px-5 py-4 lg:hidden">
      {children}
    </div>
  );
}
