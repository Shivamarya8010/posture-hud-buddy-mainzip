export interface Calibration {
  earDistance: number;
  earLevelDiff: number;
  shoulderLevelDiff: number;
  noseToShoulderMidX: number;
  timestamp: number;
}

export interface PostureChecks {
  headTiltOk: boolean;
  forwardLeanOk: boolean;
  shouldersOk: boolean;
  distanceOk: boolean;
  headTiltPenalty: number;
  forwardLeanPenalty: number;
  shouldersPenalty: number;
  distancePenalty: number;
  alertMessage: string | null;
  rawScore: number;
}

export interface DrawStatus {
  noseOk: boolean;
  earOk: boolean;
  shouldersOk: boolean;
  distanceOk: boolean;
}

const STORAGE_KEY = "posturemax_calibration";

export function saveCalibration(cal: Calibration): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cal));
}

export function loadCalibration(): Calibration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Calibration;
  } catch {
    return null;
  }
}

export function buildCalibrationFromLandmarks(lm: any[]): Calibration | null {
  if (!lm[0] || !lm[7] || !lm[8] || !lm[11] || !lm[12]) return null;
  const earDistance = Math.hypot(lm[7].x - lm[8].x, lm[7].y - lm[8].y);
  const earLevelDiff = Math.abs(lm[7].y - lm[8].y);
  const shoulderLevelDiff = Math.abs(lm[11].y - lm[12].y);
  const noseToShoulderMidX = lm[0].x - (lm[11].x + lm[12].x) / 2;
  return { earDistance, earLevelDiff, shoulderLevelDiff, noseToShoulderMidX, timestamp: Date.now() };
}

export function computePostureChecks(lm: any[], cal: Calibration): PostureChecks {
  const nose = lm[0];
  const ear7 = lm[7];
  const ear8 = lm[8];
  const sh11 = lm[11];
  const sh12 = lm[12];

  // --- Check 1: Head tilt ---
  const currentEarDiff = Math.abs(ear7.y - ear8.y);
  const headTiltDeviation = currentEarDiff - cal.earLevelDiff;
  const headTiltOk = headTiltDeviation <= 0.03;
  const headTiltPenalty = headTiltOk ? 0 : Math.min(30, headTiltDeviation * 600);

  // --- Check 2: Forward lean ---
  const currentNoseToShoulderX = nose.x - (sh11.x + sh12.x) / 2;
  const forwardDeviation = Math.abs(currentNoseToShoulderX - cal.noseToShoulderMidX);
  const forwardLeanOk = forwardDeviation <= 0.04;
  const forwardLeanPenalty = forwardLeanOk ? 0 : Math.min(40, forwardDeviation * 500);

  // --- Check 3: Screen distance ---
  const currentEarDistance = Math.hypot(ear7.x - ear8.x, ear7.y - ear8.y);
  const distanceRatio = currentEarDistance / cal.earDistance;
  const tooClose = distanceRatio > 1.25;
  const tooFar = distanceRatio < 0.75;
  const distanceOk = !tooClose && !tooFar;
  let distancePenalty = 0;
  if (tooClose) distancePenalty = Math.min(30, (distanceRatio - 1.25) * 150);
  if (tooFar) distancePenalty = Math.min(20, (0.75 - distanceRatio) * 100);

  // --- Check 4: Shoulder level ---
  const currentShoulderDiff = Math.abs(sh11.y - sh12.y);
  const shoulderDeviation = currentShoulderDiff - cal.shoulderLevelDiff;
  const shouldersOk = shoulderDeviation <= 0.03;
  const shouldersPenalty = shouldersOk ? 0 : Math.min(30, shoulderDeviation * 600);

  // --- Alert priority ---
  let alertMessage: string | null = null;
  if (!forwardLeanOk) alertMessage = "Look up a bit! 👀";
  else if (!headTiltOk) alertMessage = "Level your head — it's tilting";
  else if (!shouldersOk) alertMessage = "Straighten your shoulders";
  else if (tooClose) alertMessage = "Move back from the screen a bit";
  else if (tooFar) alertMessage = "Move closer to the screen";

  const rawScore = Math.max(0, Math.min(100,
    100 - headTiltPenalty - forwardLeanPenalty - distancePenalty - shouldersPenalty
  ));

  return {
    headTiltOk,
    forwardLeanOk,
    shouldersOk,
    distanceOk,
    headTiltPenalty,
    forwardLeanPenalty,
    shouldersPenalty,
    distancePenalty,
    alertMessage,
    rawScore,
  };
}
