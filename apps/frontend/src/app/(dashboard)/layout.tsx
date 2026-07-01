/**
 * Dashboard Layout
 *
 * Wraps all authenticated dashboard pages.
 * Includes sidebar navigation, header, and main content area.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will be added here */}
      <div className="flex flex-1 flex-col">
        {/* Header will be added here */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
