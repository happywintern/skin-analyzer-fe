"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="noise min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <span className="font-display text-2xl font-light tracking-widest text-deep">
          lumina
        </span>
        <Link
          href="/tutorial"
          className="text-sm font-body font-light tracking-wider text-earth hover:text-deep transition-colors"
        >
          Try free →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto w-full">
        {/* Tag */}
        <div
          className="animate-fade-up opacity-0-init mb-8"
          style={{ animationFillMode: "forwards" }}
        >
            <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-earth border border-stone px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
            Analisis Kulit Berbasis AI
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up opacity-0-init font-display text-6xl md:text-8xl font-light leading-tight text-deep mb-6 delay-100"
          style={{ animationFillMode: "forwards" }}
        >
          Kenali
          <br />
          <em className="italic text-earth">kulit Anda lebih dalam.</em>
        </h1>

        {/* Subtext */}
        <p
          className="animate-fade-up opacity-0-init font-body font-light text-lg text-earth max-w-md mx-auto mb-12 leading-relaxed delay-200"
          style={{ animationFillMode: "forwards" }}
        >
          Arahkan kamera Anda. Model CNN kami membaca kondisi kulit dalam beberapa detik dan
          memberi rekomendasi bahan yang sesuai — tanpa tebak-tebakan.
        </p>

        {/* CTA */}
        <div
          className="animate-fade-up opacity-0-init flex flex-col sm:flex-row gap-4 items-center delay-300"
          style={{ animationFillMode: "forwards" }}
        >
          <Link
            href="/tutorial"
            className="group bg-deep text-cream px-10 py-4 text-sm tracking-[0.15em] uppercase font-light hover:bg-earth transition-all duration-300 rounded-full"
          >
            Analisis kulit saya
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <span className="text-xs text-bark font-light">Gratis · Tidak perlu mendaftar</span>
        </div>
      </section>

      {/* Feature row */}
      <section
        className="animate-fade-up opacity-0-init grid grid-cols-3 divide-x divide-stone border-t border-stone delay-400"
        style={{ animationFillMode: "forwards" }}
      >
        {[
          { label: "Kondisi Kulit", desc: "Terdeteksi secara langsung" },
          { label: "Skor Keyakinan", desc: "Transparansi di tiap hasil" },
          { label: "Bahan", desc: "Pilihan berbasis ilmu" },
        ].map((f) => (
          <div key={f.label} className="py-8 px-8 text-center">
            <p className="font-display text-lg font-light text-deep mb-1">{f.label}</p>
            <p className="text-xs text-bark font-light tracking-wide">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
