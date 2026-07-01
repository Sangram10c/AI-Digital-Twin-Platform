/**
 * Sidebar Component (Placeholder)
 *
 * Side navigation for the dashboard layout.
 */
export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold">ADT</span>
      </div>
      <nav className="flex-1 p-4">{/* Navigation links will be added here */}</nav>
    </aside>
  );
}
