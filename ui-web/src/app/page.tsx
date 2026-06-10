'use client';

import { motion, useScroll, useTransform, useSpring, animate } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import {
  Zap, Users, BarChart3, Bell,
  ChevronRight, CheckCircle2, ArrowRight,
  Shield, Layers, Calendar, FileText,
  GitMerge, Package, AlertTriangle, X,
  TrendingUp, Clock, Lock, Activity,
  PenTool, Archive, RefreshCw, MessageSquare
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const problems = [
  {
    icon: AlertTriangle,
    title: 'Scattered tools',
    desc: 'Teams juggle multiple tools: spreadsheets, chat apps, and emails, with no single source of truth.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Clock,
    title: 'No project visibility',
    desc: 'Without centralized tracking, leadership cannot monitor project progress or team workload in real time.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: GitMerge,
    title: 'Manual approvals',
    desc: 'Change requests and document approvals are handled manually, causing delays and missing documentation.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: Archive,
    title: 'Untracked assets',
    desc: 'Asset and document records are stored in local files, making audits slow and unreliable.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
];

const solutions = [
  {
    icon: Layers,
    title: 'Centralize all internal workflows',
    desc: 'One platform for scheduling, projects, approvals, and documents.',
  },
  {
    icon: BarChart3,
    title: 'Streamline project tracking',
    desc: 'Clear task hierarchy with real-time progress and workload monitoring.',
  },
  {
    icon: RefreshCw,
    title: 'Standardize change approvals',
    desc: 'Formal workflow with multi-level approvals and a complete audit trail.',
  },
  {
    icon: Archive,
    title: 'Digitize asset and document records',
    desc: 'Centralized digital registry with automated alerts and access control.',
  },
];

const offerings = [
  {
    icon: Calendar,
    title: 'Agenda Scheduling',
    desc: 'Centralized calendar with multi-participant events and auto Telegram notifications.',
    accent: 'from-blue-50 to-indigo-50',
    tag: 'Module 01',
  },
  {
    icon: BarChart3,
    title: 'Project Management',
    desc: 'Full project lifecycle with task tracking and workload dashboards.',
    accent: 'from-emerald-50 to-teal-50',
    tag: 'Module 02',
  },
  {
    icon: GitMerge,
    title: 'Change Management',
    desc: 'Structured CR workflow with multi-level approvals and audit trail.',
    accent: 'from-violet-50 to-purple-50',
    tag: 'Module 03',
  },
  {
    icon: PenTool,
    title: 'Electronic Signature',
    desc: 'Digital signing integrated with official BSSN e-signature standards.',
    accent: 'from-sky-50 to-cyan-50',
    tag: 'Module 04',
  },
  {
    icon: FileText,
    title: 'Asset & Document Management',
    desc: 'Digital inventory with expiry alerts, versioning, and access control.',
    accent: 'from-amber-50 to-yellow-50',
    tag: 'Module 05',
  },
  {
    icon: Activity,
    title: 'Daily Brief Dashboard',
    desc: 'Real-time service metrics and system availability at a glance.',
    accent: 'from-rose-50 to-pink-50',
    tag: 'Feature',
  },
];

const benefits = [
  {
    icon: Layers,
    title: 'One platform, zero fragmentation',
    desc: 'All core internal processes in one place, accessible from any web browser.',
    color: 'text-[#284074]',
    bg: 'bg-[#284074]/8',
  },
  {
    icon: TrendingUp,
    title: 'Full visibility & accountability',
    desc: 'Dashboards and audit trails give leadership real-time insight into everything.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Bell,
    title: 'Faster coordination',
    desc: 'Automatic Telegram notifications ensure the right people are informed instantly.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    icon: Shield,
    title: 'Built for compliance',
    desc: 'RBAC, official e-signature standards (PKCS#7/CAdES), and complete activity logs.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

const beforeAfter = [
  {
    before: 'Scattered tools with no single source of truth',
    after: 'All workflows managed in one unified platform',
  },
  {
    before: 'Manual approvals with no documentation trail',
    after: 'Structured approvals with automatic notifications',
  },
  {
    before: 'Asset and document records stored in local files',
    after: 'Assets and documents digitally registered and monitored',
  },
];

const stats = [
  { value: 5,  label: 'Core Modules',   suffix: '',  icon: Layers },
  { value: 5,  label: 'User Roles',     suffix: '+', icon: Users },
  { value: 6,  label: 'Microservices',  suffix: '',  icon: Activity },
  { value: 99, label: 'Uptime',         suffix: '%', icon: Shield },
];

// ─── Components ────────────────────────────────────────────────────────────────

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return controls.stop;
  }, [inView, to]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0%' }}
      className="fixed top-0 left-0 right-0 h-0.5 bg-[#284074] z-[60]"
    />
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.3], ['0%', '15%']);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      <ScrollProgress />

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-only-black.png"
              alt="Cordina"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-xl text-[#284074] tracking-tight">Cordina</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            {[
              ['#problem', 'Problem'],
              ['#solution', 'Solution'],
              ['#modules', 'Modules'],
              ['#benefits', 'Benefits'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="relative group hover:text-[#284074] transition-colors">
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#284074] group-hover:w-full transition-all duration-300 rounded-full" />
              </a>
            ))}
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 bg-[#284074] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#1e3260] transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Sign In
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#284074_0%,_transparent_60%)] opacity-[0.06]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#3b82f6_0%,_transparent_60%)] opacity-[0.04]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#284074 1px, transparent 1px), linear-gradient(90deg, #284074 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </motion.div>

        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-32 right-24 w-20 h-20 bg-[#284074]/10 rounded-3xl hidden lg:block pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-40 right-48 w-12 h-12 bg-amber-400/20 rounded-full hidden lg:block pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-10 w-6 h-6 bg-[#284074]/20 rounded-full hidden lg:block pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#284074]/10 text-[#284074] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-[#284074]/10"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Integrated Internal Work Management Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight"
            >
              One Platform.
              <br />
              <span className="text-[#284074] relative">
                All Workflows.
                <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                  <path d="M0 5 Q100 0 200 5" stroke="#284074" strokeWidth="2.5" fill="none" strokeOpacity="0.4" />
                </svg>
              </span>
              <br />
              Zero Fragmentation.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-500 mb-8 leading-relaxed max-w-md"
            >
              Cordina integrates scheduling, project management, change management,
              e-signatures, and asset management into a single unified digital ecosystem.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#284074] text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-[#1e3260] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#modules"
                className="inline-flex items-center gap-2 bg-white text-[#284074] px-8 py-3.5 rounded-xl font-semibold text-base border-2 border-[#284074]/20 hover:border-[#284074] transition-all duration-200 hover:-translate-y-0.5"
              >
                Explore Modules
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-5 text-sm text-slate-500"
            >
              {['Role-based Access', 'Telegram Notifications', 'Full Audit Trail'].map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#284074]" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-[#284074]/10 rounded-3xl blur-2xl scale-105" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-5">
              {/* Browser bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400 font-mono">cordina.app/dashboard</span>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[
                  { label: 'Active Projects', value: '12', color: 'bg-[#284074]/5', text: 'text-[#284074]', bar: 'bg-[#284074]', pct: '60%' },
                  { label: 'Tasks Done',       value: '48', color: 'bg-emerald-50',  text: 'text-emerald-600', bar: 'bg-emerald-500', pct: '75%' },
                  { label: 'Pending CRs',      value: '5',  color: 'bg-amber-50',   text: 'text-amber-600',   bar: 'bg-amber-400',   pct: '30%' },
                ].map(card => (
                  <div key={card.label} className={`${card.color} rounded-xl p-3`}>
                    <div className={`text-2xl font-extrabold ${card.text}`}>{card.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5 mb-2">{card.label}</div>
                    <div className="h-1 bg-slate-200/70 rounded-full overflow-hidden">
                      <div style={{ width: card.pct }} className={`h-full ${card.bar} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Module list */}
              <div className="space-y-2 mb-3">
                {[
                  { icon: Calendar,  label: 'Agenda Scheduling',   status: 'Active',   dot: 'bg-emerald-400' },
                  { icon: BarChart3, label: 'Project Management',  status: 'Active',   dot: 'bg-emerald-400' },
                  { icon: GitMerge,  label: 'Change Management',   status: '2 Pending', dot: 'bg-amber-400' },
                  { icon: PenTool,   label: 'e-Sign',              status: 'Active',   dot: 'bg-emerald-400' },
                ].map(({ icon: Icon, label, status, dot }) => (
                  <div key={label} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[#284074]" />
                      <span className="text-xs font-medium text-slate-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span className="text-[10px] text-slate-400">{status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Daily brief mini */}
              <div className="bg-[#284074]/5 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#284074]">Daily Brief</span>
                  <span className="text-[10px] text-slate-400">Today</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {[4, 6, 5, 8, 7, 9, 8, 10, 9, 11].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h * 9}%` }}
                      className="flex-1 bg-[#284074] rounded-sm opacity-70"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating notification */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -left-8 bg-white rounded-xl shadow-xl border border-slate-100 px-3.5 py-2.5 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">New CR approved!</div>
                <div className="text-xs text-slate-400">System update v2.1</div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 animate-pulse" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl border border-slate-100 px-3.5 py-2.5 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-[#284074]" />
              <div>
                <div className="text-xs font-semibold text-slate-700">System Uptime</div>
                <div className="text-xs text-emerald-500 font-bold">↑ 99.9%</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="py-20 bg-[#284074] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-extrabold text-5xl text-white mb-1 tabular-nums">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section id="problem" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-rose-100">
              <AlertTriangle className="w-3.5 h-3.5" />
              The Problem
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Why This Is a Problem
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              Most organizations rely on disconnected tools that create inefficiency, risk, and blind spots across teams.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-11 h-11 ${p.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <p.icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Solution ── */}
      <section id="solution" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#284074]/3 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-[#284074]/10 text-[#284074] px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-[#284074]/10">
              <Zap className="w-3.5 h-3.5" />
              Our Solution
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              How Cordina Solves It
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Connector line */}
                {i < solutions.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[#284074]/30 to-transparent z-10" />
                )}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#284074]/20 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="w-12 h-12 bg-[#284074] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#284074]/20">
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs font-bold text-[#284074]/50 mb-1">0{i + 1}</div>
                  <h3 className="font-bold text-slate-900 mb-2 text-sm leading-snug">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Offer ── */}
      <section id="modules" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-[#284074]/10 text-[#284074] px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-[#284074]/10">
              <Layers className="w-3.5 h-3.5" />
              What We Offer
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Everything Your Team Needs
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              Five core modules and a daily brief dashboard, all in one integrated platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {offerings.map((o, i) => (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#284074]/20 hover:shadow-xl transition-all duration-300 cursor-default overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${o.accent} rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#284074]/8 rounded-xl flex items-center justify-center group-hover:bg-[#284074] transition-colors duration-300 border border-[#284074]/10">
                      <o.icon className="w-5 h-5 text-[#284074] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="text-[10px] font-bold text-[#284074]/40 bg-[#284074]/5 px-2 py-1 rounded-lg">{o.tag}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{o.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{o.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#284074]/3 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              How It's Used
            </h2>
            <p className="text-slate-500">See what changes when your team switches to Cordina.</p>
          </motion.div>

          {/* Header row */}
          <div className="grid grid-cols-[1fr_48px_1fr] gap-4 mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Before</span>
            </div>
            <div />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">After Cordina</span>
            </div>
          </div>

          <div className="space-y-4">
            {beforeAfter.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-[1fr_48px_1fr] gap-4 items-center"
              >
                <div className="bg-white rounded-xl p-4 border border-rose-100 flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full flex-shrink-0" />
                  <p className="text-sm text-slate-600">{item.before}</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-[#284074]" />
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-100 flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                  <p className="text-sm text-slate-700 font-medium">{item.after}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Benefits ── */}
      <section id="benefits" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Key Benefits
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Why Teams Choose Cordina
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#284074]/20 hover:shadow-xl transition-all duration-300 text-center cursor-default"
              >
                <div className={`w-14 h-14 ${b.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <b.icon className={`w-6 h-6 ${b.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{b.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 bg-[#284074] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#3b5fa0_0%,_#284074_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-0 w-72 h-72 bg-blue-300 rounded-full blur-3xl"
        />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <img src="/logo-only-white.png" alt="Cordina" width={36} height={36} className="object-contain" />
            </div>

            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
              Ready to Unify Your Workflows?
            </h2>
            <p className="text-blue-200 text-lg mb-8 max-w-md mx-auto">
              Sign in and start managing your team's work in one place today.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 bg-white text-[#284074] px-10 py-4 rounded-xl font-bold text-base hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:shadow-white/20 hover:-translate-y-1"
            >
              Sign in to Cordina
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
              {['Secure Login', 'Role-based Access', 'Telegram Ready'].map(badge => (
                <div key={badge} className="flex items-center gap-1.5 text-blue-200 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-white/60" />
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo-only-white.png" alt="Cordina" width={28} height={28} className="object-contain" />
              <span className="font-bold text-white">Cordina</span>
            </div>
            <div className="text-sm">© 2025 Cordina. Integrated Internal Work Management Platform.</div>
            <div className="text-sm text-slate-500">Built with care for productive teams.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
