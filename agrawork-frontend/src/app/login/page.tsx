'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Layers, ArrowRight, Lock, Mail } from 'lucide-react';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/utils';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      const { token, user } = res.data;
      setAuth(user, token);
      toast.success(`Selamat datang, ${user.full_name}!`);
      const role = user.roles?.[0] || 'staff';
      router.push(getDashboardPath(role));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#284074] relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-mesh-pattern opacity-20" />

        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-700 text-2xl text-white">Agrawork</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display text-4xl font-700 text-white mb-4 leading-tight">
              Platform Manajemen<br />Proyek Modern
            </h1>
            <p className="text-blue-200 text-base leading-relaxed mb-10">
              Kelola sprint, task, dan tim dalam satu platform terintegrasi
              dengan notifikasi real-time via Telegram.
            </p>

            <div className="space-y-4">
              {[
                'Kanban Board & Sprint Planning',
                'Burndown Chart & Velocity Report',
                'Notifikasi Telegram Real-time',
                'Role-based Access Control',
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-blue-100"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom stat cards */}
        <div className="relative grid grid-cols-3 gap-3">
          {[
            { v: '6', l: 'Services' },
            { v: '40+', l: 'Endpoints' },
            { v: '5', l: 'Roles' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="font-display font-700 text-2xl text-white">{s.v}</div>
              <div className="text-blue-300 text-xs mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-[#284074] rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-xl text-[#284074]">Agrawork</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-700 text-slate-900 mb-2">Selamat Datang</h2>
            <p className="text-slate-500 text-sm">Masuk ke akun Agrawork kamu</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email', {
                    required: 'Email wajib diisi',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Format email tidak valid' }
                  })}
                  type="email"
                  placeholder="nama@email.com"
                  className="input-field pl-10"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('password', { required: 'Password wajib diisi' })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-3">Akun untuk testing:</p>
            <div className="space-y-1.5">
              {[
                { email: 'kepala.balai@test.com', role: 'Kepala Balai' },
                { email: 'project.manager@test.com', role: 'Project Manager' },
                { email: 'staff@test.com', role: 'Staff' },
              ].map(a => (
                <div key={a.email} className="flex justify-between text-xs">
                  <span className="text-slate-600 font-mono">{a.email}</span>
                  <span className="text-[#284074] font-medium">{a.role}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-2">Password: password123</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
