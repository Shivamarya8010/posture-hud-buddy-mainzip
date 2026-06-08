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
import { loadSessions, formatDuration, type SessionRecord } from "@/lib/session";
import { loadXp, getLevelName, getCurrentLevelThreshold, getNextLevelThreshold } from "@/lib/xp";

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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function buildWeekData(sessions: SessionRecord[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayName = days[d.getDay()];
    const dayStr = d.toDateString();
    const daySessions = sessions.filter(
      (s) => new Date(s.date).toDateString() === dayStr,
    );
    const avg =
      daySessions.length > 0
        ? Math.round(daySessions.reduce((a, b) => a + b.avgScore, 0) / daySessions.length)
        : 0;
    result.push({ day: dayName, score: avg });
  }
  return result;
}

export default function Dashboard() {
  const sessions = loadSessions();
  const xp = loadXp();
  const level = xp.level;
  const levelName = getLevelName(level);
  const currentThreshold = getCurrentLevelThreshold(level);
  const nextThreshold = getNextLevelThreshold(level);

  const weekData = buildWeekData(sessions);

  // Today's stats
  const todaySessions = sessions.filter(
    (s) => new Date(s.date).toDateString() === new Date().toDateString(),
  );
  const todayScore =
    todaySessions.length > 0
      ? Math.round(todaySessions.reduce((a, b) => a + b.avgScore, 0) / todaySessions.length)
      : null;
  const todayGoodSeconds = todaySessions.reduce((a, b) => a + b.goodSeconds, 0);
  const todayGoodHours = (todayGoodSeconds / 3600).toFixed(1);

  // Streak: consecutive days with at least one session
  let streak = 0;
  const todayMs = new Date().setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const dayMs = todayMs - i * 86_400_000;
    const dayStr = new Date(dayMs).toDateString();
    const hasSessions = sessions.some((s) => new Date(s.date).toDateString() === dayStr);
    if (hasSessions) streak++;
    else break;
  }

  // Today's split
  const todayGoodPct =
    todayGoodSeconds + todaySessions.reduce((a, b) => a + b.badSeconds, 0) > 0
      ? Math.round(
          (todayGoodSeconds /
            (todayGoodSeconds + todaySessions.reduce((a, b) => a + b.badSeconds, 0))) *
            100,
        )
      : 0;
  const todayBadPct = 100 - todayGoodPct;

  return (
    <div className="min-h-screen text-white" style={{ background: "#0F172A" }}>
      <Sidebar />
      <div className="ml-12 px-8 py-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400">Your posture analytics</p>

        <div className="mt-6 grid grid-cols-4 gap-4">
          <StatCard
            label="Today's Score"
            value={todayScore !== null ? String(todayScore) : "--"}
            unit="/100"
            tint="text-emerald-400"
          />
          <StatCard label="Good Posture" value={todayGoodHours} unit="hrs" tint="text-blue-400" />
          <StatCard label="Streak" value={String(streak)} unit="days" tint="text-amber-400" />
          <StatCard
            label="Total XP"
            value={xp.total >= 1000 ? `${(xp.total / 1000).toFixed(1)}k` : String(xp.total)}
            unit={`Lvl ${level}`}
            tint="text-indigo-400"
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl p-5" style={{ background: "#1E293B" }}>
            <h2 className="text-sm font-semibold text-slate-200">Weekly Progress</h2>
            {weekData.every((d) => d.score === 0) ? (
              <div className="mt-4 flex h-60 items-center justify-center text-sm text-slate-500">
                No sessions this week yet. Start monitoring to see your progress!
              </div>
            ) : (
              <div className="mt-4 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData}>
                    <XAxis
                      dataKey="day"
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
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
                        <Cell key={d.day} fill={d.score > 0 ? barColor(d.score) : "#1E293B"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#1E293B" }}>
            <h2 className="text-sm font-semibold text-slate-200">Today's Split</h2>
            {todaySessions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No sessions today yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <SplitBar
                  label="Good posture"
                  value={formatDuration(todayGoodSeconds)}
                  pct={todayGoodPct}
                  color="#22c55e"
                />
                <SplitBar
                  label="Needs work"
                  value={formatDuration(todaySessions.reduce((a, b) => a + b.badSeconds, 0))}
                  pct={todayBadPct}
                  color="#ef4444"
                />
              </div>
            )}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="text-xs text-slate-400">{levelName}</div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.min(100, Math.round(((xp.total - currentThreshold) / (nextThreshold - currentThreshold)) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                {xp.total.toLocaleString()} / {nextThreshold.toLocaleString()} XP
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl p-5" style={{ background: "#1E293B" }}>
          <h2 className="text-sm font-semibold text-slate-200">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No sessions recorded yet. Start a monitoring session to see your history.
            </p>
          ) : (
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
                {sessions.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td className="py-3 text-slate-300">{formatDate(s.date)}</td>
                    <td className="py-3 text-slate-300">{formatDuration(s.duration)}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${scoreBadgeColor(s.avgScore)}`}
                      >
                        {s.avgScore}
                      </span>
                    </td>
                    <td className="py-3 text-indigo-300">+{s.xpEarned} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  tint,
}: {
  label: string;
  value: string;
  unit: string;
  tint: string;
}) {
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

function SplitBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
