// app/login/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, ArrowRight, Lock, Mail,
  Calendar, GitMerge, FileText, Shield, Zap
} from 'lucide-react';
import { authService, permissionService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/utils';

interface LoginForm {
  email: string;
  password: string;
}

const features = [
  { icon: Calendar, label: 'Agenda Scheduling & Telegram Notifications' },
  { icon: GitMerge, label: 'Change Management & Approval Workflow' },
  { icon: FileText, label: 'Asset & Document Management' },
  { icon: Shield,   label: 'Role-based Access Control' },
];

export default function LoginPage() {
  const router     = useRouter();
  const setAuth    = useAuthStore(s => s.setAuth);
  const updateUser = useAuthStore(s => s.updateUser);
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      const { access_token } = res.data.data;

      const payload = JSON.parse(atob(access_token.split('.')[1]));
      const user = {
        id: payload.sub,
        full_name: payload.full_name,
        email: payload.email,
        roles: payload.roles || [],
        is_active: true,
      };

      setAuth(user, access_token);
      try {
        const meRes = await authService.me();
        if (meRes.data?.data) updateUser(meRes.data.data);
      } catch {}

      // Fetch permissions
      try {
        const permRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/me/permissions`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const permData = await permRes.json();
        if (permData.data) useAuthStore.getState().setPermissions(permData.data);
      } catch {}

      toast.success(`Welcome, ${user.full_name}!`);
      const role = user.roles?.[0] || 'staff';
      router.push(getDashboardPath(role));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#284074] relative overflow-hidden flex-col justify-between p-14">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-28 right-16 w-16 h-16 bg-white/10 rounded-2xl border border-white/10"
        />
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-36 right-32 w-8 h-8 bg-amber-400/20 rounded-full"
        />

        {/* Top: Logo + Content */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-14">
            <img
              src="/logo-only-white.png"
              alt="Cordina"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-bold text-2xl text-white tracking-tight">Cordina</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="text-xs font-semibold text-blue-100">Integrated Internal Work Management</span>
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-4 leading-[1.15] tracking-tight">
              One Platform.<br />
              <span className="text-blue-200">All Workflows.</span><br />
              Zero Fragmentation.
            </h1>
            <p className="text-blue-200/80 text-sm leading-relaxed mb-10 max-w-xs">
              Scheduling, project management, change approvals, e-signatures, and document management. All unified in Cordina.
            </p>

            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-3.5 h-3.5 text-blue-200" />
                  </div>
                  <span className="text-sm text-blue-100/90">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom: Stats */}
        <div className="relative grid grid-cols-3 gap-3">
          {[
            { v: '5',   l: 'Core Modules' },
            { v: '6',   l: 'Microservices' },
            { v: '99%', l: 'Uptime' },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/12 transition-colors"
            >
              <div className="font-extrabold text-2xl text-white mb-0.5">{s.v}</div>
              <div className="text-blue-300 text-xs">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-8 bg-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#eff6ff_0%,_transparent_60%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img
              src="/logo-only-black.png"
              alt="Cordina"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-xl text-[#284074]">Cordina</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-1.5 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in to your Cordina account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focused === 'email'
                  ? 'border-[#284074] shadow-[0_0_0_4px_rgba(40,64,116,0.08)]'
                  : errors.email
                  ? 'border-red-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  focused === 'email' ? 'text-[#284074]' : 'text-slate-400'
                }`} />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' },
                  })}
                  type="email"
                  placeholder="name@email.com"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-xs mt-1.5"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focused === 'password'
                  ? 'border-[#284074] shadow-[0_0_0_4px_rgba(40,64,116,0.08)]'
                  : errors.password
                  ? 'border-red-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  focused === 'password' ? 'text-[#284074]' : 'text-slate-400'
                }`} />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#284074] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-xs mt-1.5"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              className="w-full bg-[#284074] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3260] transition-all duration-200 shadow-lg shadow-[#284074]/20 hover:shadow-xl hover:shadow-[#284074]/25 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="spinner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Sign in to Cordina
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            © 2025 Cordina. Integrated Internal Work Management Platform.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
