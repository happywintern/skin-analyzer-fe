"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CameraState = "idle" | "streaming" | "captured" | "analyzing";

export default function AnalyzePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [dots, setDots] = useState(".");
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  // Animate loading dots
  useEffect(() => {
    if (state !== "analyzing") return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [state]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setState("streaming");
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror the image (selfie mode)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setState("captured");
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setState("idle");
  }, []);

  const analyzePhoto = useCallback(async () => {
    if (!capturedImage) return;
    setState("analyzing");

    try {
      // ─── REPLACE THIS BLOCK with your real CNN endpoint ───────────────
      // const blob = await (await fetch(capturedImage)).blob();
      // const formData = new FormData();
      // formData.append("image", blob, "face.jpg");
      // const response = await fetch("/api/analyze", {
      //   method: "POST",
      //   body: formData,
      // });
      // const result = await response.json();
      // ──────────────────────────────────────────────────────────────────

      // MOCK RESPONSE — remove when real model is connected
      await new Promise((r) => setTimeout(r, 2500));
      const mockResult = {
        condition: "Acne Vulgaris",
        confidence: 87,
        description:
          "Characterized by comedones, papules, and mild inflammation. Common in oily and combination skin types.",
        ingredients: [
          {
            name: "Niacinamide",
            benefit: "Reduces sebum production and minimizes pore appearance",
            concentration: "5–10%",
          },
          {
            name: "Salicylic Acid",
            benefit: "Exfoliates inside pores and clears blackheads",
            concentration: "0.5–2%",
          },
          {
            name: "Zinc PCA",
            benefit: "Antibacterial, balances oil and soothes redness",
            concentration: "0.5–1%",
          },
          {
            name: "Centella Asiatica",
            benefit: "Calms inflammation and supports skin barrier repair",
            concentration: "Use as listed",
          },
        ],
      };
      // ── end mock ──

      // Store result in sessionStorage and navigate to results
      sessionStorage.setItem("skinResult", JSON.stringify({ ...mockResult, image: capturedImage }));
      router.push("/results");
    } catch {
      setError("Analysis failed. Please try again.");
      setState("captured");
    }
  }, [capturedImage, router]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <main className="noise min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <Link href="/" className="font-display text-2xl font-light tracking-widest text-deep">
          lumina
        </Link>
        {state !== "analyzing" && (
          <Link
            href="/tutorial"
            className="text-xs text-bark tracking-widest uppercase font-light hover:text-earth transition-colors"
          >
            ← Tutorial
          </Link>
        )}
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* ── IDLE ── */}
        {state === "idle" && (
          <div className="animate-fade-up opacity-0-init text-center max-w-sm" style={{ animationFillMode: "forwards" }}>
            <div className="w-24 h-24 rounded-full bg-stone mx-auto mb-8 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-earth">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h2 className="font-display text-4xl font-light text-deep mb-4">Ready to scan</h2>
            <p className="font-body font-light text-earth text-sm mb-10 leading-relaxed">
              We'll open your camera. Make sure you're in good lighting with your face clearly visible.
            </p>
            {error && (
              <p className="text-sm text-blush mb-6 bg-blush/10 rounded-xl px-4 py-3">{error}</p>
            )}
            <button
              onClick={startCamera}
              className="bg-deep text-cream px-10 py-4 text-sm tracking-[0.15em] uppercase font-light hover:bg-earth transition-all duration-300 rounded-full"
            >
              Open camera
            </button>
          </div>
        )}

        {/* ── STREAMING ── */}
        {state === "streaming" && (
          <div className="animate-fade-in opacity-0-init w-full max-w-md" style={{ animationFillMode: "forwards" }}>
            <p className="text-center text-xs tracking-[0.2em] uppercase text-bark mb-4 font-light">
              Position your face in the frame
            </p>
            <div className="relative rounded-2xl overflow-hidden bg-deep aspect-[3/4] w-full max-w-xs mx-auto">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {/* Viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-60">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/80" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/80" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/80" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/80" />
                </div>
              </div>
              {/* Gradient at bottom */}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-deep/60 to-transparent" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex items-center justify-center mt-8 gap-6">
              <button
                onClick={retake}
                className="text-xs text-bark font-light tracking-wider hover:text-earth transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-deep border-4 border-stone flex items-center justify-center hover:bg-earth transition-all duration-300 shadow-lg"
                aria-label="Capture photo"
              >
                <span className="w-8 h-8 rounded-full bg-cream" />
              </button>
              <div className="w-12" />
            </div>
          </div>
        )}

        {/* ── CAPTURED ── */}
        {state === "captured" && capturedImage && (
          <div className="animate-fade-in opacity-0-init w-full max-w-xs mx-auto text-center" style={{ animationFillMode: "forwards" }}>
            <p className="text-xs tracking-[0.2em] uppercase text-bark mb-4 font-light">
              Looking good?
            </p>
            <div className="rounded-2xl overflow-hidden aspect-[3/4] w-full bg-stone">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
            </div>
            {error && (
              <p className="text-sm text-blush mt-4 bg-blush/10 rounded-xl px-4 py-3">{error}</p>
            )}
            <div className="flex gap-4 mt-8 justify-center">
              <button
                onClick={retake}
                className="border border-stone text-earth px-8 py-3 text-sm tracking-[0.12em] uppercase font-light hover:border-earth transition-all rounded-full"
              >
                Retake
              </button>
              <button
                onClick={analyzePhoto}
                className="bg-deep text-cream px-8 py-3 text-sm tracking-[0.12em] uppercase font-light hover:bg-earth transition-all rounded-full"
              >
                Analyze →
              </button>
            </div>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {state === "analyzing" && (
          <div className="animate-fade-in opacity-0-init text-center" style={{ animationFillMode: "forwards" }}>
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-stone animate-spin" style={{ borderTopColor: "var(--earth)", animationDuration: "1.2s" }} />
              <div className="absolute inset-3 rounded-full bg-stone/50" />
            </div>
            <h2 className="font-display text-4xl font-light text-deep mb-3">
              Analyzing{dots}
            </h2>
            <p className="font-body font-light text-earth text-sm">
              Our CNN model is reading your skin
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
