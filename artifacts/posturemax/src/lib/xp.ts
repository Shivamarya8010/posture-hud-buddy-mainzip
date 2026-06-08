export interface XpData {
  total: number;
  level: number;
}

const STORAGE_KEY = "posturemax_xp";

const LEVELS = [
  { level: 0, name: "Sloucher", threshold: 0 },
  { level: 1, name: "Waking Up", threshold: 100 },
  { level: 2, name: "Straightening", threshold: 250 },
  { level: 3, name: "Posture Aware", threshold: 500 },
  { level: 4, name: "Aligned", threshold: 900 },
  { level: 5, name: "Balanced", threshold: 1400 },
  { level: 6, name: "Upright", threshold: 2000 },
  { level: 7, name: "Posture Pro", threshold: 2700 },
  { level: 8, name: "Elite Posture", threshold: 3500 },
  { level: 9, name: "Posture Master", threshold: 5000 },
];

export function getLevelForXp(xp: number): number {
  let level = 0;
  for (const l of LEVELS) {
    if (xp >= l.threshold) level = l.level;
  }
  return level;
}

export function getLevelName(level: number): string {
  return LEVELS[level]?.name ?? "Posture Master";
}

export function getNextLevelThreshold(level: number): number {
  return LEVELS[level + 1]?.threshold ?? LEVELS[LEVELS.length - 1].threshold;
}

export function getCurrentLevelThreshold(level: number): number {
  return LEVELS[level]?.threshold ?? 0;
}

export function loadXp(): XpData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { total: 0, level: 0 };
    return JSON.parse(raw) as XpData;
  } catch {
    return { total: 0, level: 0 };
  }
}

export function addXp(amount: number): XpData {
  const current = loadXp();
  const total = current.total + amount;
  const level = getLevelForXp(total);
  const updated: XpData = { total, level };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
