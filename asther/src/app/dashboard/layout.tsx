import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-stone-50">
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <span className="text-lg font-semibold text-stone-900">Asther</span>
              <div className="ml-8 flex items-baseline space-x-1">
                <a
                  href="/dashboard"
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="/dashboard/demo"
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  Demo
                </a>
                <a
                  href="/dashboard/config"
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  Config
                </a>
                <a
                  href="/dashboard/knowledge"
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  Knowledge
                </a>
                <a
                  href="/dashboard/history"
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  History
                </a>
                <a
                  href="/dashboard/api-docs"
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  API Docs
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <a
                href="/dashboard/settings"
                className="text-stone-500 hover:text-stone-900 text-sm"
              >
                {user.name || user.email}
              </a>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
