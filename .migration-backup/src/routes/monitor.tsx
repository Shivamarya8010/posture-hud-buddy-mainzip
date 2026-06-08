import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CameraFeed } from "@/components/CameraFeed";
import { Check, X, User, Settings as Gear, Pause, Play, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/monitor")({
  head: () => ({ meta: [{ title: "PostureMax — Live" }] }),
  component: Monitor,
});

type State = 0 | 1 | 2;
const states = [
  { head: true, shoulders: true, distance: true, score: 87, alert: null as string | null },
  { head: false, shoulders: true, distance: true, score: 67, alert: "Look up a bit! 👀" },
  { head: false, shoulders: false, distance: false, score: 33, alert: "Fix your posture!" },
];

function formatTime(s: number) {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function Monitor() {
  const [stateIdx, setStateIdx] = useState<State>(0);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(42 * 60 + 15);
  const [alertVisible, setAlertVisible] = useState(false);

  const cur = states[stateIdx];

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (cur.alert) {
      setAlertVisible(true);
      const t = setTimeout(() => setAlertVisible(false), 3000);
      return () => clearTimeout(t);
    } else {
      setAlertVisible(false);
    }
  }, [stateIdx, cur.alert]);

  const scoreColor = useMemo(() => {
    if (cur.score >= 80) return "text-emerald-400";
    if (cur.score >= 50) return "text-amber-400";
    return "text-red-500";
  }, [cur.score]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Sidebar />
      <div className="absolute inset-0 left-12">
        <CameraFeed status={{ head: cur.head, shoulders: cur.shoulders, distance: cur.distance }} />

        {/* Top left: user panel */}
        <div
          className="absolute left-2 top-2 w-[200px] rounded-xl border border-white/10 p-3 text-white backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-xs font-bold">
              U
            </div>
            <div className="flex-1 text-xs font-semibold">user</div>
            <span className="rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-bold">
              Lvl 3
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: "68%" }} />
          </div>
          <div className="mt-1 text-[10px] text-slate-300">340 / 500 XP</div>
        </div>

        {/* Top center alert */}
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
          {alertVisible && cur.alert ? (
            <div
              className="animate-in fade-in rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.65)" }}
            >
              {cur.alert}
            </div>
          ) : !cur.alert ? (
            <div
              className="rounded-full border border-emerald-400/30 px-4 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              Good posture ✓
            </div>
          ) : null}
        </div>

        {/* Top right metrics */}
        <div
          className="absolute right-2 top-2 w-[200px] rounded-xl border border-white/10 p-3 text-white backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <MetricRow label="Head" ok={cur.head} />
          <MetricRow label="Shoulders" ok={cur.shoulders} />
          <MetricRow label="Screen distance" ok={cur.distance} />
          <div className="my-2 border-t border-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">SCORE:</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>{cur.score}%</span>
          </div>
          <Link
            to="/"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500/15 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/25"
          >
            <User size={12} />
            Calibrate
          </Link>
        </div>

        {/* Bottom left session */}
        <div
          className="absolute bottom-3 left-3 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.55)", fontFamily: "ui-monospace, monospace" }}
        >
          Session: {formatTime(seconds)}
        </div>

        {/* Bottom right controls */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Link
            to="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white backdrop-blur-md transition hover:bg-white/10"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <Gear size={16} />
          </Link>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white backdrop-blur-md transition hover:bg-white/10"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>

        {/* Dev state toggle */}
        <button
          onClick={() => setStateIdx(((stateIdx + 1) % 3) as State)}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-slate-300 backdrop-blur-md transition hover:text-white"
          style={{ background: "rgba(0,0,0,0.45)" }}
          title="Cycle mock state"
        >
          <FlaskConical size={12} />
          Demo state {stateIdx + 1}/3
        </button>
      </div>
    </div>
  );
}

function MetricRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-slate-200">{label}</span>
      {ok ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
          <X size={12} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}