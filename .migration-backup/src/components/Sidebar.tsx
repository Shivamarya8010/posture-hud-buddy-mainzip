import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, BarChart3, Settings } from "lucide-react";

const items = [
  { to: "/", icon: Camera, label: "Live" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-12 flex-col items-center gap-2 py-4"
      style={{ background: "#0F172A" }}
    >
      {items.map(({ to, icon: Icon, label }) => {
        const active =
          to === "/"
            ? pathname === "/" || pathname === "/monitor"
            : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            title={label}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon size={20} />
          </Link>
        );
      })}
    </aside>
  );
}