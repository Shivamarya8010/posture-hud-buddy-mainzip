import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { CameraFeed, DrawStatus } from "@/components/CameraFeed";
import {
  loadCalibration,
  computePostureChecks,
  type PostureChecks,
} from "@/lib/posture";
import {
  loadXp,
  addXp,
  getLevelName,
  getCurrentLevelThreshold,
  getNextLevelThreshold,
  type XpData,
} from "@/lib/xp";
import { saveSession } from "@/lib/session";
import { Check, X, User, Settings as Gear, Pause, Play } from "lucide-react";

const SCORE_HISTORY = 15;

function formatTime(s: number) {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {}
}

export default function Monitor() {
  const [, navigate] = useLocation();
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Posture state (updated from onResults callback)
  const [score, setScore] = useState<number | null>(null);
  const [checks, setChecks] = useState<PostureChecks | null>(null);
  const [inFrame, setInFrame] = useState(false);
  const [drawStatus, setDrawStatus] = useState<DrawStatus>({
    noseOk: true,
    earOk: true,
    shouldersOk: true,
    showLandmarks: true,
  });

  // XP state
  const [xpData, setXpData] = useState<XpData>(() => loadXp());

  // Refs for callback-internal mutable state (no re-renders)
  const scoreHistoryRef = useRef<number[]>([]);
  const pausedRef = useRef(false);
  const secondsRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const goodSecondsRef = useRef(0);
  const badSecondsRef = useRef(0);
  const allScoresRef = useRef<number[]>([]);
  const xpIntervalRef = useRef<number | null>(null);
  const xpGoodStreak = useRef(0); // seconds above 70 this minute
  const sessionXpRef = useRef(0);
  const lastAlertRef = useRef(0);
  const notifGrantedRef = useRef(false);
  const calibration = useRef(loadCalibration());

  // Redirect if no calibration
  useEffect(() => {
    if (!calibration.current) {
      navigate("/");
    }
  }, [navigate]);

  // Keep pausedRef in sync
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      if (pausedRef.current) return;
      secondsRef.current += 1;
      setSeconds(secondsRef.current);

      // Track good/bad seconds
      const smoothed =
        scoreHistoryRef.current.length > 0
          ? scoreHistoryRef.current.reduce((a, b) => a + b, 0) / scoreHistoryRef.current.length
          : 0;
      if (smoothed >= 70) {
        goodSecondsRef.current += 1;
        xpGoodStreak.current += 1;
      } else {
        badSecondsRef.current += 1;
        xpGoodStreak.current = 0;
      }

      // XP: every 60 seconds above 70 → +10 XP
      if (xpGoodStreak.current >= 60) {
        xpGoodStreak.current = 0;
        sessionXpRef.current += 10;
        const updated = addXp(10);
        setXpData(updated);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Request notification permission upfront
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        notifGrantedRef.current = p === "granted";
      });
    } else {
      notifGrantedRef.current = Notification.permission === "granted";
    }
  }, []);

  // Save session on unmount
  useEffect(() => {
    return () => {
      const duration = secondsRef.current;
      if (duration < 5) return; // don't save trivial sessions
      const totalScores = allScoresRef.current;
      const avgScore =
        totalScores.length > 0
          ? Math.round(totalScores.reduce((a, b) => a + b, 0) / totalScores.length)
          : 0;
      saveSession({
        date: new Date(sessionStartRef.current).toISOString(),
        duration,
        avgScore,
        goodSeconds: goodSecondsRef.current,
        badSeconds: badSecondsRef.current,
        xpEarned: sessionXpRef.current,
      });
    };
  }, []);

  const handleResults = useCallback(
    (lm: any[] | null) => {
      if (pausedRef.current) return;

      if (!lm || !calibration.current) {
        setInFrame(false);
        return;
      }

      // Need all required landmarks
      if (!lm[0] || !lm[7] || !lm[8] || !lm[11] || !lm[12]) {
        setInFrame(false);
        return;
      }

      setInFrame(true);
      const result = computePostureChecks(lm, calibration.current);

      // Score smoothing
      scoreHistoryRef.current.push(result.rawScore);
      if (scoreHistoryRef.current.length > SCORE_HISTORY) {
        scoreHistoryRef.current.shift();
      }
      const smoothed = Math.round(
        scoreHistoryRef.current.reduce((a, b) => a + b, 0) /
          scoreHistoryRef.current.length,
      );
      allScoresRef.current.push(result.rawScore);

      setScore(smoothed);
      setChecks(result);
      setDrawStatus({
        noseOk: result.forwardLeanOk,
        earOk: result.headTiltOk,
        shouldersOk: result.shouldersOk,
        showLandmarks: true,
      });

      // Notification + beep when score drops below 70
      if (smoothed < 70 && result.alertMessage) {
        const now = Date.now();
        const isHidden = document.hidden;
        if (now - lastAlertRef.current > 30_000) {
          lastAlertRef.current = now;
          playBeep();
          if (isHidden && notifGrantedRef.current) {
            new Notification("PostureMax", { body: result.alertMessage });
          }
        }
      }
    },
    [],
  );

  if (!calibration.current) return null;

  const headOk = checks ? checks.headTiltOk && checks.forwardLeanOk : true;
  const shouldersOk = checks ? checks.shouldersOk : true;
  const distanceOk = checks ? checks.distanceOk : true;

  const scoreColor =
    score === null
      ? "text-slate-400"
      : score >= 80
        ? "text-emerald-400"
        : score >= 50
          ? "text-amber-400"
          : "text-red-500";

  const alertMsg = !inFrame
    ? "Come back into frame"
    : checks?.alertMessage ?? null;

  const level = xpData.level;
  const levelName = getLevelName(level);
  const currentThreshold = getCurrentLevelThreshold(level);
  const nextThreshold = getNextLevelThreshold(level);
  const xpInLevel = xpData.total - currentThreshold;
  const xpForNextLevel = nextThreshold - currentThreshold;
  const xpPct = Math.min(100, Math.round((xpInLevel / xpForNextLevel) * 100));

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Sidebar />
      <div className="absolute inset-0 left-12">
        <CameraFeed onResults={handleResults} drawStatus={drawStatus} />

        {/* Top left: user / XP panel */}
        <div
          className="absolute left-2 top-2 w-[210px] rounded-xl border border-white/10 p-3 text-white backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-xs font-bold">
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{levelName}</div>
            </div>
            <span className="rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
              Lvl {level}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-slate-300">
            {xpData.total.toLocaleString()} / {nextThreshold.toLocaleString()} XP
          </div>
        </div>

        {/* Top center: alert pill */}
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 z-10">
          {!inFrame ? (
            <AlertPill message="Come back into frame" type="warn" />
          ) : alertMsg ? (
            <AlertPill message={alertMsg} type="fail" />
          ) : (
            <AlertPill message="Great posture! ✓" type="pass" />
          )}
        </div>

        {/* Top right: metrics panel */}
        <div
          className="absolute right-2 top-2 w-[210px] rounded-xl border border-white/10 p-3 text-white backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <MetricRow label="Head" ok={headOk} />
          <MetricRow label="Shoulders" ok={shouldersOk} />
          <MetricRow label="Screen distance" ok={distanceOk} />
          <div className="my-2 border-t border-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">SCORE:</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {score === null || !inFrame ? "--" : `${score}%`}
            </span>
          </div>
          <Link
            to="/"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500/15 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/25"
          >
            <User size={12} />
            Recalibrate
          </Link>
        </div>

        {/* Bottom left: session timer */}
        <div
          className="absolute bottom-3 left-3 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.55)", fontFamily: "ui-monospace, monospace" }}
        >
          Session: {formatTime(seconds)}
        </div>

        {/* Bottom right: controls */}
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

function AlertPill({ message, type }: { message: string; type: "pass" | "fail" | "warn" }) {
  if (type === "pass") {
    return (
      <div
        className="rounded-full border border-emerald-400/30 px-4 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        {message}
      </div>
    );
  }
  return (
    <div
      className="rounded-full border-l-4 px-5 py-2 text-sm font-bold text-white backdrop-blur-md"
      style={{
        background: "rgba(0,0,0,0.65)",
        borderColor: type === "fail" ? "#EF4444" : "#F59E0B",
        borderTopWidth: "1px",
        borderRightWidth: "1px",
        borderBottomWidth: "1px",
      }}
    >
      {message}
    </div>
  );
}
