import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Pose?: any;
    Camera?: any;
    drawConnectors?: any;
    drawLandmarks?: any;
  }
}

type LandmarkStatus = {
  head: boolean;
  shoulders: boolean;
  distance: boolean;
};

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
  status?: LandmarkStatus;
  drawLandmarks?: boolean;
}

export function CameraFeed({ status, drawLandmarks: doDraw = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let pose: any = null;
    let cameraUtil: any = null;
    let stopped = false;
    let rafId = 0;

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
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"),
        ]);
        if (stopped) return;

        pose = new window.Pose({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        pose.onResults(onResults);

        cameraUtil = new window.Camera(videoRef.current, {
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

    const onResults = (results: any) => {
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
      if (!doDraw || !results.poseLandmarks) return;

      const lm = results.poseLandmarks;
      const s = statusRef.current || { head: true, shoulders: true, distance: true };

      // mirror coords since video is mirrored
      const toXY = (p: any) => ({ x: (1 - p.x) * canvas.width, y: p.y * canvas.height });

      const headColor = s.head ? "#22c55e" : "#ef4444";
      const shColor = s.shoulders ? "#22c55e" : "#ef4444";

      // connect ears
      if (lm[7] && lm[8]) {
        const a = toXY(lm[7]);
        const b = toXY(lm[8]);
        ctx.strokeStyle = headColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // connect shoulders
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

      const dot = (idx: number, color: string, r = 7) => {
        if (!lm[idx]) return;
        const { x, y } = toXY(lm[idx]);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      };
      dot(0, headColor);
      dot(7, headColor, 6);
      dot(8, headColor, 6);
      dot(11, shColor);
      dot(12, shColor);
    };

    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      try {
        cameraUtil?.stop?.();
      } catch {}
      try {
        pose?.close?.();
      } catch {}
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [doDraw]);

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