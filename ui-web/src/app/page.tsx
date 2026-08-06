'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: { heroPrefix: 'Where work', heroHighlight: 'connects', cta: 'Open ConnectOne' },
  id: { heroPrefix: 'Tempat kerja', heroHighlight: 'terhubung', cta: 'Buka ConnectOne' },
};

export default function LandingPage() {
  const { locale, setLocale } = useLocale();
  const t = useT(dict);
  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden font-sans flex flex-col">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 50% at 50% 38%, rgba(201,151,27,0.12), transparent 70%)' }}
      />

      {/* Oversized faint logo watermark */}
      <motion.img
        src="/logo-only-white.png"
        alt=""
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="absolute -right-40 -top-40 w-[680px] h-[680px] object-contain pointer-events-none select-none"
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center px-8 sm:px-14 py-8 flex-none">
        <div className="flex items-center gap-2.5">
          <img src="/logo-only-white.png" alt="" width={24} height={24} className="object-contain" />
          <span className="text-white font-semibold text-[14px] tracking-tight">ConnectOne</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[11px] font-semibold">
          <button
            onClick={() => setLocale('en')}
            className={`px-2 py-1 rounded-sm transition-colors ${locale === 'en' ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
          >
            EN
          </button>
          <span className="text-white/20">/</span>
          <button
            onClick={() => setLocale('id')}
            className={`px-2 py-1 rounded-sm transition-colors ${locale === 'id' ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
          >
            ID
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-semibold text-white leading-[1.05] tracking-[-0.03em]"
          style={{ fontSize: 'clamp(2.6rem, 6.5vw, 5rem)' }}
        >
          {t('heroPrefix')} <span className="text-gold-500">{t('heroHighlight')}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-12"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-navy-900 px-7 py-3 text-[13.5px] font-semibold rounded-sm hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-azure-400 transition-all duration-150"
          >
            {t('cta')}
          </Link>
        </motion.div>
      </div>

      {/* Footer line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="relative z-10 text-center text-white/25 text-[11px] pb-8 flex-none"
      >
        Balai Layanan Penghubung Identitas Digital &middot; 2026
      </motion.p>
    </div>
  );
}
