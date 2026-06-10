'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import {
  LayoutDashboard, Zap, Users, BarChart3, Bell,
  ChevronRight, CheckCircle2, ArrowRight, Star,
  GitBranch, Clock, Shield, Layers
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Kanban & Scrum Board',
    desc: 'Kelola task dengan drag-and-drop yang intuitif. Visualisasi progress tim secara real-time.',
  },
  {
    icon: BarChart3,
    title: 'Burndown & Velocity',
    desc: 'Pantau performa sprint dengan grafik burndown dan velocity yang akurat.',
  },
  {
    icon: Bell,
    title: 'Notifikasi Telegram',
    desc: 'Terima notifikasi assignment dan update langsung di Telegram. Tidak ada yang terlewat.',
  },
  {
    icon: Users,
    title: 'Manajemen Tim',
    desc: 'Atur peran dan kapasitas setiap anggota tim. Role-based access control yang ketat.',
  },
  {
    icon: GitBranch,
    title: 'Sprint Planning',
    desc: 'Rencanakan sprint dengan epic, story, dan task yang terstruktur rapi.',
  },
  {
    icon: Shield,
    title: 'Multi-Role Access',
    desc: 'Kepala Balai, Project Manager, Scrum Master, Staff — setiap peran punya akses tepat.',
  },
];

const stats = [
  { value: '6', label: 'Microservices', suffix: '' },
  { value: '5', label: 'Role Pengguna', suffix: '+' },
  { value: '40', label: 'API Endpoints', suffix: '+' },
  { value: '99', label: 'Uptime', suffix: '%' },
];

const workflows = [
  { step: '01', title: 'Buat Project', desc: 'Kepala Balai membuat project dan menambahkan tim' },
  { step: '02', title: 'Rencanakan Sprint', desc: 'PM & Scrum Master menyusun sprint dan task' },
  { step: '03', title: 'Kerjakan Task', desc: 'Staff mengerjakan dan update status task' },
  { step: '04', title: 'Monitor Progress', desc: 'Pantau burndown, velocity, dan laporan tim' },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#284074] rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-xl text-[#284074]">Agrawork</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#284074] transition-colors">Fitur</a>
            <a href="#workflow" className="hover:text-[#284074] transition-colors">Cara Kerja</a>
            <a href="#stats" className="hover:text-[#284074] transition-colors">Statistik</a>
          </div>
          <Link href="/login" className="btn-primary text-sm">
            Masuk ke App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-mesh-pattern opacity-50" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#284074]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl" />

        {/* Floating shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-32 right-20 w-16 h-16 bg-[#284074]/10 rounded-2xl hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-40 right-40 w-10 h-10 bg-amber-400/20 rounded-full hidden lg:block"
        />

        <motion.div style={{ y, opacity }} className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#284074]/10 text-[#284074] px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Zap className="w-3.5 h-3.5" />
              Platform Manajemen Proyek Modern
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl lg:text-6xl font-700 text-slate-900 leading-tight mb-6"
            >
              Kelola Proyek
              <br />
              <span className="text-[#284074]">Lebih Cerdas</span>
              <br />
              Lebih Cepat
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-500 mb-8 leading-relaxed"
            >
              Agrawork menggabungkan Scrum, Kanban, dan laporan analitik dalam satu platform
              terintegrasi. Dirancang untuk tim pemerintahan yang dinamis.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/login" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
                Mulai Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="btn-secondary flex items-center gap-2 text-base px-8 py-3">
                Pelajari Fitur
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex items-center gap-6 text-sm text-slate-500"
            >
              {['Role-based Access', 'Notifikasi Real-time', 'Laporan Analytics'].map(item => (
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
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative">
              {/* Mini dashboard preview */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="text-xs text-slate-400 font-mono">agrawork.app/dashboard</div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Active Tasks', value: '24', color: 'bg-blue-50 text-blue-600' },
                  { label: 'Done', value: '18', color: 'bg-green-50 text-green-600' },
                  { label: 'Sprint', value: '3d', color: 'bg-orange-50 text-orange-600' },
                ].map(card => (
                  <div key={card.label} className={`${card.color} rounded-xl p-3 text-center`}>
                    <div className="text-2xl font-display font-700">{card.value}</div>
                    <div className="text-xs mt-0.5">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Kanban preview */}
              <div className="grid grid-cols-3 gap-2">
                {['To Do', 'In Progress', 'Done'].map((col, i) => (
                  <div key={col} className="bg-slate-50 rounded-lg p-2">
                    <div className="text-xs font-medium text-slate-500 mb-2">{col}</div>
                    {[...Array(i + 1)].map((_, j) => (
                      <div key={j} className="bg-white rounded p-2 mb-1.5 shadow-sm border border-slate-100">
                        <div className="h-1.5 bg-slate-200 rounded mb-1 w-full" />
                        <div className="h-1.5 bg-slate-100 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Burndown mini chart */}
              <div className="mt-3 bg-[#284074]/5 rounded-xl p-3">
                <div className="text-xs font-medium text-[#284074] mb-2">Sprint Burndown</div>
                <div className="flex items-end gap-1 h-10">
                  {[10, 9, 8, 7, 7, 6, 5, 4, 3, 2].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h * 10}%` }}
                      className="flex-1 bg-[#284074] rounded-sm opacity-70"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating notification */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-6 -left-6 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-700">Task di-assign!</div>
                <div className="text-xs text-slate-400">Buat endpoint login</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-[#284074]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center text-white"
              >
                <div className="font-display text-5xl font-700 mb-1">
                  {stat.value}<span className="text-3xl">{stat.suffix}</span>
                </div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-[#284074]/10 text-[#284074] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Fitur Lengkap
            </div>
            <h2 className="font-display text-4xl font-700 text-slate-900 mb-4">
              Semua yang Tim Kamu Butuhkan
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Dari perencanaan sprint hingga laporan analitik — semua tersedia dalam satu platform terintegrasi.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="card-hover group"
              >
                <div className="w-12 h-12 bg-[#284074]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#284074] transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-[#284074] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-display font-600 text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-700 text-slate-900 mb-4">
              Cara Kerja Agrawork
            </h2>
            <p className="text-slate-500">Empat langkah sederhana untuk tim yang lebih produktif</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#284074]/30 to-transparent" />
            {workflows.map((wf, i) => (
              <motion.div
                key={wf.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 bg-[#284074] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <span className="font-display font-700 text-white text-lg">{wf.step}</span>
                </div>
                <h3 className="font-display font-600 text-slate-900 mb-2">{wf.title}</h3>
                <p className="text-sm text-slate-500">{wf.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-700 text-slate-900 mb-4">
              Dirancang untuk Setiap Peran
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { role: 'Kepala Balai', icon: '👑', desc: 'Buat project, kelola tim, pantau semua laporan' },
              { role: 'Kepala Seksi', icon: '📋', desc: 'Supervisi project dan distribusi workload' },
              { role: 'Project Manager', icon: '🎯', desc: 'Kelola sprint, assign task, monitor progress' },
              { role: 'Scrum Master', icon: '⚡', desc: 'Fasilitasi sprint, burndown, velocity' },
              { role: 'Staff', icon: '💼', desc: 'Kerjakan task, log waktu, update status' },
            ].map((item, i) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card text-center hover:border-[#284074]/20 hover:shadow-glow transition-all duration-300"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="font-display font-600 text-slate-800 text-sm mb-2">{item.role}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#284074] relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl lg:text-5xl font-700 text-white mb-6">
              Siap Mulai Kelola Proyek?
            </h2>
            <p className="text-blue-200 text-lg mb-8">
              Masuk dan mulai kelola proyek tim kamu hari ini.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-[#284074] px-8 py-4 rounded-xl font-600 text-base hover:bg-blue-50 transition-colors shadow-glow-lg"
            >
              Masuk ke Agrawork
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#284074] rounded-lg flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-600 text-white">Agrawork</span>
            </div>
            <div className="text-sm">
              © 2026 Agrawork. Platform Manajemen Proyek.
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Dibuat dengan ❤️ untuk tim yang produktif
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
