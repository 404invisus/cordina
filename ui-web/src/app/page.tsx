'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MODULES = [
  {
    n: '01',
    title: 'Agenda & Calendar',
    body: 'Schedule activities, assign participants, and the system automatically sends Telegram notifications whenever there are changes.',
  },
  {
    n: '02',
    title: 'Project Management',
    body: 'Track project progress from epic to subtask level. Sprints, kanban board, and roadmap are all available in one connected workflow.',
  },
  {
    n: '03',
    title: 'Change Management',
    body: 'Every change request goes through a submission, review, and approval flow — fully recorded and auditable at any time.',
  },
  {
    n: '04',
    title: 'Assets & Documents',
    body: 'Digital inventory for physical assets and official documents. Includes expiry notifications, version history, and access control.',
  },
  {
    n: '05',
    title: 'Daily Brief',
    body: 'A daily summary showing service status, tasks that need attention, and activities scheduled for today.',
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
    <div className="min-h-screen bg-bg-page text-navy-900 font-sans">
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
          scrolled ? 'bg-bg-page/95 backdrop-blur-sm border-b border-navy-700/10' : ''
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={scrolled ? '/logo-only-black.png' : '/logo-only-white.png'}
              alt="ConnectOne"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className={`font-semibold text-sm tracking-tight ${scrolled ? 'text-navy-700' : 'text-white'}`}>ConnectOne</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-navy-700 border border-navy-700/25 px-4 py-1.5 rounded-sm hover:bg-navy-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-azure-400 transition-all duration-150"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <section className="bg-navy-700 pt-28 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto lg:pl-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-azure-400 text-xs font-semibold tracking-[0.18em] uppercase mb-7"
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
            Everything your team needs,
            <br />
            <span className="text-gold-500">in one system.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-border-subtle/65 text-base leading-relaxed max-w-lg mb-10"
          >
            ConnectOne brings together activity scheduling, project management, change approval workflows, and asset management into a
            single platform.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-navy-700 px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-bg-page focus:outline-none focus:ring-2 focus:ring-azure-400 transition-colors duration-150"
            >
              Open ConnectOne
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="h-0.5 bg-gold-500" />

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between pb-4 border-b border-navy-700/12 mb-2">
            <h2 className="font-display text-navy-700 text-xl">What's available</h2>
          </div>

          {MODULES.map((m, i) => (
            <motion.div
              key={m.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.06 }}
              className="grid grid-cols-[32px_1fr] md:grid-cols-[32px_200px_1fr] gap-x-6 py-5 border-b border-navy-700/8 group"
            >
              <span className="text-gold-500 font-mono text-xs font-semibold pt-0.5">{m.n}</span>
              <p className="font-semibold text-navy-700 text-sm leading-snug">{m.title}</p>
              <p className="col-start-2 md:col-start-3 text-sm text-navy-900/55 leading-relaxed mt-1 md:mt-0">{m.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-navy-700 py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-white text-2xl mb-1">Your account is ready.</h2>
            <p className="text-border-subtle/50 text-sm">Contact your administrator if you don't have access yet.</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-navy-700 px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-bg-page focus:outline-none focus:ring-2 focus:ring-azure-400 transition-colors duration-150 flex-shrink-0"
          >
            Sign in to ConnectOne
          </Link>
        </div>
      </section>

      <footer className="bg-navy-900 py-7 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo-only-white.png" alt="" width={16} height={16} className="object-contain opacity-50" />
            <span className="text-white/35 text-xs font-medium">ConnectOne</span>
          </div>
          <p className="text-white/25 text-xs">Balai Layanan Penghubung Identitas Digital &middot; BSSN &middot; 2026</p>
        </div>
      </footer>
    </div>
  );
}
