import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function Settings() {
  const [threshold, setThreshold] = useState(70);
  const [sound, setSound] = useState(true);
  const [notif, setNotif] = useState(false);
  const [cooldown, setCooldown] = useState("30s");
  const [sens, setSens] = useState("Medium");

  return (
    <div className="min-h-screen text-white" style={{ background: "#0F172A" }}>
      <Sidebar />
      <div className="ml-12 max-w-3xl px-8 py-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400">Tune alerts and detection</p>

        <Card title="Alert Settings">
          <Row label="Alert threshold">
            <div className="flex w-64 items-center gap-3">
              <input
                type="range"
                min={50}
                max={90}
                value={threshold}
                onChange={(e) => setThreshold(+e.target.value)}
                className="flex-1 accent-blue-500"
              />
              <span className="w-8 text-right text-sm font-semibold text-blue-400">{threshold}</span>
            </div>
          </Row>
          <Row label="Sound">
            <Toggle on={sound} onChange={setSound} />
          </Row>
          <Row label="Browser notifications">
            <Toggle on={notif} onChange={setNotif} />
          </Row>
          <Row label="Cooldown">
            <Segmented options={["15s", "30s", "60s"]} value={cooldown} onChange={setCooldown} />
          </Row>
        </Card>

        <Card title="Detection">
          <Row label="Sensitivity">
            <Segmented options={["Low", "Medium", "High"]} value={sens} onChange={setSens} />
          </Row>
        </Card>

        <Card title="Plan">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
              Head & Shoulders · $17 one-time
            </span>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
            <li>✓ Head & shoulder posture detection</li>
            <li>✓ Real-time alerts</li>
            <li>✓ Daily analytics</li>
          </ul>
          <button className="mt-5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold transition hover:bg-indigo-400">
            Upgrade to Full Body · $39
          </button>
        </Card>

        <Card title="Danger Zone">
          <div className="flex gap-3">
            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/5">
              Recalibrate
            </button>
            <button className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/25">
              Reset all data
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl p-5" style={{ background: "#1E293B" }}>
      <h2 className="mb-4 text-sm font-semibold text-slate-200">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-blue-500" : "bg-white/10"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-white/5 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            value === o ? "bg-blue-500 text-white" : "text-slate-300 hover:text-white"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
