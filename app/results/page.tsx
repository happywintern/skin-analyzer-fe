"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Ingredient {
  name: string;
  benefit: string;
  concentration: string;
}

interface SkinResult {
  condition: string;
  confidence: number;
  description: string;
  ingredients: Ingredient[];
  status?: string;
  top3?: { label: string; confidence: number }[];
  image?: string;
}

function ConfidenceBar({ value }: { value: number }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const color =
    value >= 80 ? "bg-sage" : value >= 60 ? "bg-bark" : "bg-blush";

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs text-bark tracking-widest uppercase font-light">
          Confidence
        </span>
        <span className="font-display text-3xl font-light text-deep">{value}%</span>
      </div>
      <div className="h-1.5 bg-stone rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: animated ? `${value}%` : "0%" }}
        />
      </div>
      <p className="text-xs text-bark mt-2 font-light">
        {value >= 80
          ? "High confidence — strong match"
          : value >= 60
          ? "Moderate confidence — likely match"
          : "Low confidence — consider a second scan"}
      </p>
    </div>
  );
}

export default function ResultsPage() {
  const [result, setResult] = useState<SkinResult | null>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("skinResult");
    if (!stored) {
      router.push("/");
      return;
    }
    setResult(JSON.parse(stored));
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [router]);

  if (!result) return null;

  return (
    <main className="noise min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <Link href="/" className="font-display text-2xl font-light tracking-widest text-deep">
          lumina
        </Link>
        <span className="text-xs text-bark tracking-widest uppercase font-light">
          Hasil Anda
        </span>
      </nav>

      <div className="flex-1 px-6 py-4 max-w-2xl mx-auto w-full pb-16">

        {/* Photo + condition */}
        <div
          className="flex gap-6 items-start mb-10 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
        >
          {result.image && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-stone">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.image} alt="Your scan" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="pt-1">
            <p className="text-xs tracking-[0.2em] uppercase text-bark font-light mb-1">
              Kondisi terdeteksi
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-deep leading-tight">
              {result.condition}
            </h1>
            {result.status === "uncertain" && (
              <p className="text-sm text-bark font-light">Prediksi kurang pasti — menampilkan 3 kemungkinan teratas.</p>
            )}
            {result.status === "invalid" && (
              <p className="text-sm text-blush font-light">Prediksi tidak valid. Coba ulangi pemindaian dengan pencahayaan lebih baik.</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div
          className="mb-8 transition-all duration-700 delay-100"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transitionDelay: "150ms" }}
        >
          <p className="font-body font-light text-earth text-sm leading-relaxed border-l-2 border-stone pl-5">
            {result.description}
          </p>
        </div>

        {/* Confidence / Top-3 */}
        <div
          className="bg-stone/40 rounded-2xl p-6 mb-8 border border-stone transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transitionDelay: "250ms" }}
        >
          {result.top3 && result.top3.length > 0 ? (
            <div>
              <ConfidenceBar value={result.confidence ?? Math.round(result.top3[0].confidence)} />
              <div className="mt-4">
                <h3 className="text-sm text-bark font-light mb-2">Top 3 kemungkinan</h3>
                <ol className="text-sm text-earth list-decimal list-inside space-y-1">
                  {result.top3.map((t) => (
                    <li key={t.label} className="flex items-center justify-between">
                      <span>{t.label}</span>
                      <span className="font-display text-sm text-deep">{Math.round(t.confidence)}%</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <ConfidenceBar value={result.confidence} />
          )}
        </div>

        {/* Ingredients */}
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transitionDelay: "400ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-light text-deep">
              Rekomendasi bahan
            </h2>
            <span className="text-xs text-bark font-light">{result.ingredients.length} ditemukan</span>
          </div>

          <div className="space-y-3">
            {result.ingredients.map((ing, i) => (
              <div
                key={ing.name}
                className="bg-cream border border-stone rounded-2xl px-6 py-5 transition-all duration-500"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(12px)",
                  transitionDelay: `${500 + i * 100}ms`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-body font-medium text-deep text-sm">{ing.name}</span>
                      <span className="text-xs bg-stone text-earth px-2.5 py-0.5 rounded-full font-light">
                        {ing.concentration}
                      </span>
                    </div>
                    <p className="text-xs text-earth font-light leading-relaxed">{ing.benefit}</p>
                  </div>
                  <span className="text-sage text-lg shrink-0 mt-0.5">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-10 p-5 bg-stone/30 rounded-2xl transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transitionDelay: "900ms" }}
        >
          <p className="text-xs text-bark font-light leading-relaxed text-center">
            Hasil ini dihasilkan oleh model AI dan hanya untuk tujuan informasi.
            Selalu konsultasikan dengan dokter kulit untuk saran medis.
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col sm:flex-row gap-4 mt-10 justify-center transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transitionDelay: "1000ms" }}
        >
          <Link
            href="/analyze"
            className="text-center border border-stone text-earth px-8 py-3.5 text-sm tracking-[0.12em] uppercase font-light hover:border-earth transition-all rounded-full"
          >
            Pindai lagi
          </Link>
          <Link
            href="/"
            className="text-center bg-deep text-cream px-8 py-3.5 text-sm tracking-[0.12em] uppercase font-light hover:bg-earth transition-all rounded-full"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
