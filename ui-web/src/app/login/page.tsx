'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { permissionService } from '@/lib/api';
import { getDashboardPath } from '@/lib/utils';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const updateUser = useAuthStore((s) => s.updateUser);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

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
      try {
        const permRes = await permissionService.myPermissions();
        if (permRes.data?.data) setPermissions(permRes.data.data);
      } catch {}
      toast.success(`Welcome, ${user.full_name.split(' ')[0]}!`);
      router.push(getDashboardPath(user.roles?.[0]));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0 bg-navy-900 px-12 py-10 relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 50% at 50% 35%, rgba(201,151,27,0.12), transparent 70%)' }}
        />

        <div className="relative z-10 flex items-center gap-2.5 flex-none">
          <img src="/logo-only-white.png" alt="" width={24} height={24} className="object-contain" />
          <span className="text-white font-semibold text-[14px] tracking-tight">ConnectOne</span>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center">
          <img src="/logo-only-white.png" alt="ConnectOne" width={120} height={120} className="object-contain opacity-10" />
        </div>

        <p className="relative z-10 text-white/25 text-xs flex-none">Balai Layanan Penghubung Identitas Digital</p>
      </div>

      <div className="flex-1 flex flex-col bg-bg-page relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 45% 50% at 82% 18%, rgba(201,151,27,0.06), transparent 70%)' }}
        />

        {/* Faint logo watermark */}
        <img
          src="/logo-only-black.png"
          alt=""
          className="absolute -right-28 -bottom-28 w-[440px] h-[440px] object-contain opacity-[0.025] pointer-events-none select-none"
        />

        <div className="relative z-10 lg:hidden px-6 py-5 flex items-center gap-2 border-b border-navy-700/8">
          <img src="/logo-only-black.png" alt="ConnectOne" width={20} height={20} className="object-contain" />
          <span className="font-semibold text-navy-700 text-sm">ConnectOne</span>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-sm"
          >
            <h1 className="font-display text-navy-700 mb-8 leading-tight text-[1.6rem]">Sign in</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-navy-700/60 uppercase tracking-wider mb-2">Email</label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' },
                  })}
                  type="email"
                  placeholder="email@bssn.go.id"
                  autoComplete="email"
                  className={`w-full px-4 py-3 border-b-2 bg-transparent text-sm text-navy-900 placeholder:text-navy-700/25 outline-none transition-colors ${
                    errors.email ? 'border-danger' : 'border-navy-700/15 focus:border-navy-700'
                  }`}
                />
                {errors.email && <p className="text-danger text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-700/60 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-10 border-b-2 bg-transparent text-sm text-navy-900 placeholder:text-navy-700/25 outline-none transition-colors ${
                      errors.password ? 'border-danger' : 'border-navy-700/15 focus:border-navy-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-700/30 hover:text-navy-700/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-danger text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center rounded-[6px] bg-navy-700 text-white py-3 text-sm font-bold hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-azure-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-navy-700/10" />
              <span className="text-[11px] font-semibold text-navy-700/35 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-navy-700/10" />
            </div>

            <button type="button" className="w-full flex items-center justify-center">
              <img src="/login-with-connectidn.png" alt="Login with CONNECTIDN" className="h-11 object-contain" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
