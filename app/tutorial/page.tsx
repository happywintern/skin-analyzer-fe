"use client";

import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Cari pencahayaan yang baik",
    desc: "Cahaya alami atau ruangan yang terang bekerja paling baik. Hindari bayangan tajam atau backlight — kulit terlihat lebih jelas dengan pencahayaan merata.",
  },
  {
    number: "02",
    title: "Posisikan wajah Anda",
    desc: "Pusatkan wajah di bingkai. Model bekerja optimal jika seluruh wajah terlihat — dahi, pipi, hidung, dan dagu.",
  },
  {
    number: "03",
    title: "Ambil foto",
    desc: "Diamkan dan ketuk tombol ambil. Foto yang bersih tanpa blur memberi model detail yang diperlukan untuk pembacaan akurat.",
  },
  {
    number: "04",
    title: "Dapatkan hasil",
    desc: "Dalam hitungan detik, Anda akan melihat kondisi kulit, skor keyakinan, dan daftar bahan yang direkomendasikan.",
  },
];

export default function TutorialPage() {
  return (
    <main className="noise min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <Link
          href="/"
          className="font-display text-2xl font-light tracking-widest text-deep"
        >
          lumina
        </Link>
        <span className="text-xs text-bark tracking-widest uppercase font-light">
          How it works
        </span>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div
          className="animate-fade-up opacity-0-init text-center mb-16"
          style={{ animationFillMode: "forwards" }}
        >
            <h1 className="font-display text-5xl md:text-6xl font-light text-deep mb-4">
              Sebelum memulai
            </h1>
            <p className="font-body font-light text-earth text-base leading-relaxed">
              Empat langkah sederhana untuk hasil yang paling akurat.
            </p>
        </div>

        {/* Steps */}
        <div className="w-full space-y-0">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="animate-fade-up opacity-0-init flex gap-8 py-8 border-b border-stone last:border-b-0"
              style={{
                animationFillMode: "forwards",
                animationDelay: `${i * 120 + 100}ms`,
              }}
            >
              <span className="font-display text-4xl font-light text-bark shrink-0 w-12">
                {step.number}
              </span>
              <div className="pt-1">
                <h3 className="font-body font-medium text-deep mb-2 tracking-wide">
                  {step.title}
                </h3>
                <p className="font-body font-light text-earth text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div
          className="animate-fade-up opacity-0-init w-full mt-10 bg-stone/50 rounded-2xl px-8 py-6 border border-stone"
          style={{ animationFillMode: "forwards", animationDelay: "600ms" }}
        >
          <p className="text-xs tracking-[0.15em] uppercase text-bark mb-3 font-light">
            Tips singkat
          </p>
          <ul className="space-y-2">
            {[
              "Lepas kacamata sebelum pemindaian",
              "Wajah bersih lebih disarankan — hindari riasan tebal",
              "Jaga jarak ponsel 25–35 cm dari wajah",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-sm text-earth font-light">
                <span className="text-sage mt-0.5">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div
          className="animate-fade-up opacity-0-init mt-12"
          style={{ animationFillMode: "forwards", animationDelay: "700ms" }}
        >
          <Link
            href="/analyze"
            className="group bg-deep text-cream px-12 py-4 text-sm tracking-[0.15em] uppercase font-light hover:bg-earth transition-all duration-300 rounded-full inline-flex items-center gap-2"
          >
            I&apos;m ready
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
