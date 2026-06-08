import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { CameraFeed } from "@/components/CameraFeed";
import { User } from "lucide-react";

export default function Calibration() {
  const [, navigate] = useLocation();
  const [saved, setSaved] = useState(false);

  const onCalibrate = () => {
    setSaved(true);
    setTimeout(() => navigate("/monitor"), 1500);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Sidebar />
      <div className="absolute inset-0 left-12">
        <CameraFeed drawLandmarks={false} />

        {/* Corner brackets */}
        <CornerBrackets flash={saved} />

        {/* Horizontal dashed guide */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-px"
          style={{
            background:
              "repeating-linear-gradient(90deg, #3B82F6 0 10px, transparent 10px 20px)",
            opacity: 0.6,
          }}
        />

        {/* Top pill */}
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
          <div
            className={`rounded-full border px-6 py-2 backdrop-blur-md ${
              saved
                ? "border-emerald-400 text-emerald-300"
                : "border-blue-400 text-blue-200"
            }`}
            style={{
              background: "rgba(0,0,0,0.6)",
              boxShadow: saved
                ? "0 0 20px rgba(16,185,129,0.6)"
                : "0 0 20px rgba(59,130,246,0.5)",
            }}
          >
            <span className="text-xs font-bold uppercase tracking-[0.25em]">
              {saved ? "✓ Baseline Saved" : "Look Directly at the Camera"}
            </span>
          </div>
        </div>

        {/* Bottom card */}
        <div className="absolute bottom-8 left-1/2 w-[460px] -translate-x-1/2 rounded-xl border border-white/10 p-5 text-white backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <h2 className="text-lg font-bold">Set Your Baseline</h2>
          <p className="mt-1 text-xs text-slate-300">
            Sit straight, look at the camera, press calibrate
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] text-slate-200">
            {["Sit straight", "Look forward", "Shoulders level", "Good distance"].map(
              (s, i) => (
                <div key={s} className="flex flex-col items-center gap-1 rounded-md bg-white/5 p-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-center">{s}</span>
                </div>
              ),
            )}
          </div>
          <button
            onClick={onCalibrate}
            disabled={saved}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
          >
            <User size={16} />
            {saved ? "Saved ✓" : "Calibrate Now"}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            Takes 2 seconds · Recalibrate anytime
          </p>
        </div>
      </div>
    </div>
  );
}

function CornerBrackets({ flash }: { flash: boolean }) {
  const color = flash ? "#22c55e" : "#3B82F6";
  const cls = "absolute h-12 w-12 border-current";
  return (
    <div
      className="pointer-events-none absolute inset-4 animate-pulse"
      style={{ color }}
    >
      <div className={`${cls} left-0 top-0 border-l-4 border-t-4`} />
      <div className={`${cls} right-0 top-0 border-r-4 border-t-4`} />
      <div className={`${cls} bottom-0 left-0 border-b-4 border-l-4`} />
      <div className={`${cls} bottom-0 right-0 border-b-4 border-r-4`} />
    </div>
  );
}
