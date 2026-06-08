import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Pose?: any;
    Camera?: any;
  }
}

export interface DrawStatus {
  noseOk: boolean;
  earOk: boolean;
  shouldersOk: boolean;
  showLandmarks: boolean;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("failed " + src));
    document.head.appendChild(s);
  });
}

interface Props {
  onResults?: (lm: any[] | null) => void;
  drawStatus?: DrawStatus;
}

export function CameraFeed({ onResults, drawStatus }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawStatusRef = useRef(drawStatus);
  drawStatusRef.current = drawStatus;
  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let pose: any = null;
    let cameraUtil: any = null;
    let stopped = false;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false,
        });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});

        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"),
        ]);
        if (stopped) return;

        pose = new window.Pose!({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        pose.onResults(handleResults);

        cameraUtil = new window.Camera!(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && !stopped) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });
        cameraUtil.start();
      } catch (e) {
        console.error("Camera error:", e);
      }
    };

    const handleResults = (results: any) => {
      const lm: any[] | null = results.poseLandmarks ?? null;

      onResultsRef.current?.(lm);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const w = video.videoWidth || canvas.clientWidth;
      const h = video.videoHeight || canvas.clientHeight;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const ds = drawStatusRef.current;
      if (!ds?.showLandmarks || !lm) return;

      // Mirror X since video is mirrored via CSS scaleX(-1)
      const toXY = (p: any) => ({
        x: (1 - p.x) * canvas.width,
        y: p.y * canvas.height,
      });

      const GREEN = "#22C55E";
      const RED = "#EF4444";
      const WHITE50 = "rgba(255,255,255,0.5)";

      const noseColor = ds.noseOk ? GREEN : RED;
      const earColor = ds.earOk ? GREEN : RED;
      const shColor = ds.shouldersOk ? GREEN : RED;

      // Line: ear to ear
      if (lm[7] && lm[8]) {
        const a = toXY(lm[7]);
        const b = toXY(lm[8]);
        ctx.strokeStyle = earColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Line: shoulder to shoulder
      if (lm[11] && lm[12]) {
        const a = toXY(lm[11]);
        const b = toXY(lm[12]);
        ctx.strokeStyle = shColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nose to ear midpoint vertical reference line
      if (lm[0] && lm[7] && lm[8]) {
        const nose = toXY(lm[0]);
        const earMid = {
          x: (toXY(lm[7]).x + toXY(lm[8]).x) / 2,
          y: (toXY(lm[7]).y + toXY(lm[8]).y) / 2,
        };
        ctx.strokeStyle = WHITE50;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nose.x, nose.y);
        ctx.lineTo(earMid.x, earMid.y);
        ctx.stroke();
      }

      // Dots
      const dot = (idx: number, color: string) => {
        if (!lm[idx]) return;
        const { x, y } = toXY(lm[idx]);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      dot(0, noseColor);           // Nose
      dot(1, noseColor);           // Right eye inner
      dot(4, noseColor);           // Left eye inner
      dot(7, earColor);            // Right ear
      dot(8, earColor);            // Left ear
      dot(11, shColor);            // Right shoulder
      dot(12, shColor);            // Left shoulder
    };

    start();

    return () => {
      stopped = true;
      try { cameraUtil?.stop?.(); } catch {}
      try { pose?.close?.(); } catch {}
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
