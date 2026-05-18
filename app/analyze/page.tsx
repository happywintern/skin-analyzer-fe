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
  const capturedBlobRef = useRef<Blob | null>(null);
  // Selection rectangle (relative to displayed image in pixels)
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const draggingRef = useRef<{ mode: "move" | "resize" | null; startX: number; startY: number; orig?: { x: number; y: number; w: number; h: number } } | null>(null);
  const imgContainerRef = useRef<HTMLDivElement | null>(null) as React.MutableRefObject<HTMLDivElement | null>;
  const [dots, setDots] = useState(".");
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setError("Akses kamera ditolak. Izinkan akses kamera lalu coba lagi.");
    }
  }, []);

  // Attach stream AFTER the video element is in the DOM
  useEffect(() => {
    if (state === "streaming" && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => {
        video.play().catch(() => {
          // autoplay blocked — still fine, user interaction already happened
        });
      };
    }
  }, [state]);

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
    // create a resized blob from canvas to reduce memory before storing
    canvas.toBlob((b) => {
      if (!b) return;
      try { URL.revokeObjectURL(capturedImage ?? ""); } catch {}
      capturedBlobRef.current = b;
      const url = URL.createObjectURL(b);
      setCapturedImage(url);
    }, "image/jpeg", 0.86);
    stopCamera();
    setState("captured");
  }, [stopCamera]);

  const downscaleFileToBlob = useCallback(async (file: File, maxDim = 1024) => {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width, height } = img;
        let targetW = width;
        let targetH = height;
        if (Math.max(width, height) > maxDim) {
          const scale = maxDim / Math.max(width, height);
          targetW = Math.round(width * scale);
          targetH = Math.round(height * scale);
        }
        const c = document.createElement("canvas");
        c.width = targetW;
        c.height = targetH;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("No canvas"));
        ctx.drawImage(img, 0, 0, targetW, targetH);
        c.toBlob((b) => { if (b) resolve(b); else reject(new Error("toBlob failed")); }, "image/jpeg", 0.86);
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }, []);

  const onFilePicked = useCallback(async (file?: File | null) => {
    const f = file ?? (fileInputRef.current?.files?.[0] ?? null);
    if (!f) return;
    try {
      const blob = await downscaleFileToBlob(f, 1024);
      // revoke previous URL
      try { URL.revokeObjectURL(capturedImage ?? ""); } catch {}
      capturedBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setCapturedImage(url);
      setState("captured");
    } catch (err) {
      setError("Gagal memproses gambar. Coba file lain.");
    }
  }, [downscaleFileToBlob, capturedImage]);

  const openDeviceCamera = useCallback(() => {
    // prefer front camera for selfie mode
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  }, []);

  const retake = useCallback(() => {
    try { URL.revokeObjectURL(capturedImage ?? ""); } catch {}
    capturedBlobRef.current = null;
    setCapturedImage(null);
    setState("idle");
  }, []);

  const analyzePhoto = useCallback(async () => {
    if (!capturedImage) return;
    setState("analyzing");

    try {
      // If user selected an area, crop that portion; otherwise send full image
      let blob: Blob;
      if (sel) {
        // draw image into an offscreen canvas at natural resolution and crop using scaled coords
        const sourceBlob = capturedBlobRef.current ?? await (await fetch(capturedImage)).blob();
        const img = await createImageBitmap(sourceBlob);
        const off = document.createElement("canvas");
        const naturalW = img.width;
        const naturalH = img.height;
        off.width = sel.w;
        off.height = sel.h;
        const ctx = off.getContext("2d");
        if (!ctx) throw new Error("No canvas context");

        // Need to map displayed selection coords to natural image coords
        // To compute scale, create a temporary img element to get displayed size
        const tmp = document.createElement("img");
        tmp.src = capturedImage;
        await new Promise((r) => (tmp.onload = r));
        const dispW = tmp.width;
        const dispH = tmp.height;
        const scaleX = naturalW / dispW;
        const scaleY = naturalH / dispH;

        const sx = Math.round(sel.x * scaleX);
        const sy = Math.round(sel.y * scaleY);
        const sw = Math.round(sel.w * scaleX);
        const sh = Math.round(sel.h * scaleY);

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height);
        blob = await new Promise<Blob>((res) => off.toBlob((b) => res(b as Blob), "image/jpeg", 0.92));
      } else {
        blob = capturedBlobRef.current ?? await (await fetch(capturedImage)).blob();
      }

      const formData = new FormData();
      formData.append("image", blob, "crop.jpg");
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Analyze request failed");
      }
      const result = await response.json();

      // Handle server-side validity
      if (result.status === "invalid") {
        setError("Prediksi tidak valid. Coba ambil foto lain dengan pencahayaan lebih baik.");
        setState("captured");
        return;
      }

      // Create a display image for results: use the cropped blob (or full captured image)
      let displayUrl = capturedImage;
      try {
        // if we created a cropped blob earlier, reuse it; otherwise use capturedBlobRef
        const sourceBlobForDisplay = blob ?? (capturedBlobRef.current ?? await (await fetch(capturedImage)).blob());
        // revoke previous URL if any
        try { URL.revokeObjectURL(displayUrl ?? ""); } catch {}
        displayUrl = URL.createObjectURL(sourceBlobForDisplay);
      } catch {
        // fallback to existing capturedImage
        displayUrl = capturedImage;
      }

      // Store result (include highlighted/cropped image) and navigate to results
      sessionStorage.setItem("skinResult", JSON.stringify({ ...result, image: displayUrl }));
      router.push("/results");
    } catch {
      setError("Analisis Gagal. Silakan coba lagi.");
      setState("captured");
    }
  }, [capturedImage, router]);

  // Mouse/touch handlers for selection rectangle
  const onStartDrag = (e: React.PointerEvent) => {
    if (!e.currentTarget) return;
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // if clicking inside existing selection, start move using existing sel
    if (sel && x >= sel.x && x <= sel.x + sel.w && y >= sel.y && y <= sel.y + sel.h) {
      draggingRef.current = { mode: "move", startX: e.clientX, startY: e.clientY, orig: { ...sel } };
    } else {
      // start a new selection at this point
      const startW = Math.max(80, Math.floor(rect.width * 0.25));
      const startH = Math.max(80, Math.floor(rect.height * 0.25));
      const startX = Math.max(0, Math.min(x - startW / 2, rect.width - startW));
      const startY = Math.max(0, Math.min(y - startH / 2, rect.height - startH));
      setSel({ x: startX, y: startY, w: startW, h: startH });
      draggingRef.current = { mode: "move", startX: e.clientX, startY: e.clientY, orig: { x: startX, y: startY, w: startW, h: startH } };
    }
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMoveImage = (e: React.PointerEvent) => {
    if (!draggingRef.current || !sel) return;
    const d = draggingRef.current;
    if (!d.orig) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.mode === "move") {
      const cw = imgContainerRef.current?.clientWidth ?? (e.currentTarget as HTMLDivElement).clientWidth;
      const ch = imgContainerRef.current?.clientHeight ?? (e.currentTarget as HTMLDivElement).clientHeight;
      setSel((s) => s ? ({ ...s, x: Math.max(0, Math.min(d.orig!.x + dx, cw - d.orig!.w)), y: Math.max(0, Math.min(d.orig!.y + dy, ch - d.orig!.h)) }) : s);
    }
    if (d.mode === "resize") {
      const cw = imgContainerRef.current?.clientWidth ?? (e.currentTarget as HTMLDivElement).clientWidth;
      const ch = imgContainerRef.current?.clientHeight ?? (e.currentTarget as HTMLDivElement).clientHeight;
      const minW = 40;
      const minH = 40;
      const newW = Math.max(minW, Math.min(d.orig!.w + dx, cw - d.orig!.x));
      const newH = Math.max(minH, Math.min(d.orig!.h + dy, ch - d.orig!.y));
      setSel((s) => s ? ({ ...s, w: newW, h: newH }) : s);
    }
  };

  const onEndDrag = (e: React.PointerEvent) => {
    if (draggingRef.current) draggingRef.current = null;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
  };

  const onStartResize = (corner: "br") => (e: React.PointerEvent) => {
    if (!sel) return;
    draggingRef.current = { mode: "resize", startX: e.clientX, startY: e.clientY, orig: { ...sel } };
    (e.target as Element).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

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
              <h2 className="font-display text-4xl font-light text-deep mb-4">Siap memindai</h2>
              <p className="font-body font-light text-earth text-sm mb-10 leading-relaxed">
                Kami akan membuka kamera Anda. Pastikan pencahayaan baik dan wajah terlihat jelas.
              </p>
            {error && (
              <p className="text-sm text-blush mb-6 bg-blush/10 rounded-xl px-4 py-3">{error}</p>
            )}
            <div className="gap-2 flex flex-col sm:flex-row items-center justify-center">
            <button
              onClick={startCamera}
              className="bg-deep text-cream px-10 py-4 text-sm tracking-[0.15em] uppercase font-light hover:bg-earth transition-all duration-300 rounded-full"
            >
              Open camera
            </button>
            <button
              onClick={openDeviceCamera}
              className="bg-stone text-deep px-6 py-4 text-sm tracking-[0.12em] uppercase font-light hover:bg-stone/90 transition-all duration-300 rounded-full"
            >
              Select Image
            </button>

            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*, application/vnd.apple.raw-image"
              // capture="user"
              onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>
        )}

        {/* ── STREAMING ── */}
        {state === "streaming" && (
          <div className="animate-fade-in opacity-0-init w-full max-w-md" style={{ animationFillMode: "forwards" }}>
            <p className="text-center text-xs tracking-[0.2em] uppercase text-bark mb-4 font-light">
              Posisikan wajah Anda di dalam bingkai
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
               Batal
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
              Tandai bagian yang ingin dianalisis
            </p>
            <div className="rounded-2xl overflow-hidden aspect-[3/4] w-full bg-stone relative" style={{ touchAction: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
              {/* Selection overlay container */}
              <div
                ref={imgContainerRef}
                className="absolute inset-0"
                onPointerDown={onStartDrag}
                onPointerMove={onPointerMoveImage}
                onPointerUp={onEndDrag}
                onPointerCancel={onEndDrag}
              >
                {sel && (
                  <div
                    style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
                    className="absolute border-2 border-earth bg-earth/20 touch-none"
                  >
                    <div
                      onPointerDown={onStartResize("br")}
                      className="absolute right-0 bottom-0 w-4 h-4 bg-earth/80"
                    />
                  </div>
                )}
              </div>
            </div>
            {error && (
              <p className="text-sm text-blush mt-4 bg-blush/10 rounded-xl px-4 py-3">{error}</p>
            )}
            <div className="flex gap-4 mt-8 justify-center">
              <button
                onClick={retake}
                className="border border-stone text-earth px-8 py-3 text-sm tracking-[0.12em] uppercase font-light hover:border-earth transition-all rounded-full"
              >
               Ambil lagi
              </button>
              <button
                onClick={analyzePhoto}
                className="bg-deep text-cream px-8 py-3 text-sm tracking-[0.12em] uppercase font-light hover:bg-earth transition-all rounded-full"
              >
                Crop & Analisis →
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
                Menganalisis{dots}
              </h2>
              <p className="font-body font-light text-earth text-sm">
                Model CNN kami sedang membaca kondisi kulit Anda
              </p>
          </div>
        )}
      </div>
    </main>
  );
}
