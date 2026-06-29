'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MODULES = [
  {
    n: '01',
    title: 'Agenda dan Kalender',
    body: 'Jadwalkan kegiatan, tentukan peserta, dan sistem akan mengirim notifikasi ke Telegram secara otomatis ketika ada perubahan.',
  },
  {
    n: '02',
    title: 'Manajemen Proyek',
    body: 'Pantau perkembangan proyek dari level epic hingga subtask. Sprint, kanban board, dan roadmap tersedia dalam satu alur kerja yang terhubung.',
  },
  {
    n: '03',
    title: 'Change Management',
    body: 'Setiap usulan perubahan melewati alur pengajuan, peninjauan, dan persetujuan yang tercatat lengkap dan bisa diaudit kapan saja.',
  },
  {
    n: '04',
    title: 'Aset dan Dokumen',
    body: 'Inventaris digital untuk aset fisik dan dokumen resmi. Dilengkapi notifikasi masa berlaku, riwayat versi, dan pengaturan hak akses.',
  },
  {
    n: '05',
    title: 'Daily Brief',
    body: 'Ringkasan harian yang menampilkan kondisi layanan, task yang perlu perhatian, dan kegiatan yang akan berlangsung hari ini.',
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#f4f2ee] text-[#0d1f2d]"
      style={{ fontFamily: '"Source Sans 3", "Source Sans Pro", system-ui, sans-serif' }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled ? 'bg-[#f4f2ee]/95 backdrop-blur-sm border-b border-[#083858]/10' : ''
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={scrolled ? "/logo-only-black.png" : "/logo-only-white.png"}
              alt="Cordina"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className={`font-semibold text-sm tracking-tight ${scrolled ? 'text-[#083858]' : 'text-white'}`}>Cordina</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-[#083858] border border-[#083858]/25 px-4 py-1.5 rounded-sm hover:bg-[#083858] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3fa3d0] transition-all duration-150"
          >
            Masuk
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#083858] pt-28 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto lg:pl-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[#3fa3d0] text-xs font-semibold tracking-[0.18em] uppercase mb-7"
          >
            Balai Layanan Penghubung Identitas Digital
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-display text-white leading-[1.08] tracking-tight mb-7"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)' }}
          >
            Semua yang tim butuhkan,<br />
            <span className="text-[#d4a31d]">dalam satu sistem.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[#e8e4dc]/65 text-base leading-relaxed max-w-lg mb-10"
          >
            Cordina menghubungkan penjadwalan kegiatan, manajemen proyek,
            proses persetujuan perubahan, dan pengelolaan aset dalam satu
            platform 
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#d4a31d] text-[#083858] px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-[#c4941a] focus:outline-none focus:ring-2 focus:ring-[#d4a31d]/60 transition-colors duration-150"
            >
              Buka Cordina
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Garis aksen gold tipis di bawah hero */}
      <div className="h-0.5 bg-[#d4a31d]" />

      {/* Modul */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between pb-4 border-b border-[#083858]/12 mb-2">
            <h2 className="font-display text-[#083858] text-xl">Apa saja yang tersedia</h2>
          </div>

          {MODULES.map((m, i) => (
            <motion.div
              key={m.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.06 }}
              className="grid grid-cols-[32px_1fr] md:grid-cols-[32px_200px_1fr] gap-x-6 py-5 border-b border-[#083858]/8 group"
            >
              <span className="text-[#d4a31d] font-mono text-xs font-semibold pt-0.5">{m.n}</span>
              <p className="font-semibold text-[#083858] text-sm leading-snug">{m.title}</p>
              <p className="col-start-2 md:col-start-3 text-sm text-[#0d1f2d]/55 leading-relaxed mt-1 md:mt-0">{m.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#083858] py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-white text-2xl mb-1">Akun kamu sudah tersedia.</h2>
            <p className="text-[#e8e4dc]/50 text-sm">Hubungi administrator jika belum mendapat akses.</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#d4a31d] text-[#083858] px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-[#c4941a] focus:outline-none focus:ring-2 focus:ring-[#d4a31d]/60 transition-colors duration-150 flex-shrink-0"
          >
            Masuk ke Cordina
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#06293f] py-7 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo-only-white.png" alt="" width={16} height={16} className="object-contain opacity-50" />
            <span className="text-white/35 text-xs font-medium">Cordina</span>
          </div>
          <p className="text-white/25 text-xs">
            Balai Layanan Penghubung Identitas Digital &middot; BSSN &middot; 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
