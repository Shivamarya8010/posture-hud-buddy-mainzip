import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "PostureMax — Dashboard" }] }),
  component: Dashboard,
});

const weekData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 85 },
  { day: "Wed", score: 68 },
  { day: "Thu", score: 91 },
  { day: "Fri", score: 78 },
  { day: "Sat", score: 88 },
  { day: "Sun", score: 84 },
];

const sessions = [
  { date: "Jun 7", duration: "1h 12m", score: 88, xp: 120 },
  { date: "Jun 6", duration: "48m", score: 74, xp: 80 },
  { date: "Jun 5", duration: "2h 04m", score: 91, xp: 210 },
  { date: "Jun 4", duration: "32m", score: 62, xp: 50 },
  { date: "Jun 3", duration: "1h 41m", score: 85, xp: 170 },
  { date: "Jun 2", duration: "55m", score: 79, xp: 90 },
];

function barColor(v: number) {
  if (v >= 80) return "#22c55e";
  if (v >= 60) return "#f59e0b";
  return "#ef4444";
}

function scoreBadgeColor(v: number) {
  if (v >= 80) return "bg-emerald-500/15 text-emerald-400";
  if (v >= 60) return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
}

function Dashboard() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#0F172A" }}>
      <Sidebar />
      <div className="ml-12 px-8 py-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400">Your posture analytics</p>

        <div className="mt-6 grid grid-cols-4 gap-4">
          <StatCard label="Today's Score" value="84" unit="/100" tint="text-emerald-400" />
          <StatCard label="Good Posture" value="2.4" unit="hrs" tint="text-blue-400" />
          <StatCard label="Streak" value="5" unit="days" tint="text-amber-400" />
          <StatCard label="Total XP" value="1.2k" unit="" tint="text-indigo-400" />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl p-5" style={{ background: "#1E293B" }}>
            <h2 className="text-sm font-semibold text-slate-200">Weekly Progress</h2>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
                  <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      color: "white",
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {weekData.map((d) => (
                      <Cell key={d.day} fill={barColor(d.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#1E293B" }}>
            <h2 className="text-sm font-semibold text-slate-200">Today's Split</h2>
            <div className="mt-4 space-y-4">
              <SplitBar label="Good posture" value="2h 24m" pct={80} color="#22c55e" />
              <SplitBar label="Bad posture" value="36m" pct={20} color="#ef4444" />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl p-5" style={{ background: "#1E293B" }}>
          <h2 className="text-sm font-semibold text-slate-200">Recent Sessions</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Avg Score</th>
                <th className="pb-2 font-medium">XP earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sessions.map((s) => (
                <tr key={s.date}>
                  <td className="py-3 text-slate-300">{s.date}</td>
                  <td className="py-3 text-slate-300">{s.duration}</td>
                  <td className="py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${scoreBadgeColor(s.score)}`}>
                      {s.score}
                    </span>
                  </td>
                  <td className="py-3 text-indigo-300">+{s.xp} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, tint }: { label: string; value: string; unit: string; tint: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#1E293B" }}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${tint}`}>{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function SplitBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}