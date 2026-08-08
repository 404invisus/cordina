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
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: {
    signIn: 'Sign in',
    email: 'Email',
    password: 'Password',
    emailRequired: 'Email is required',
    invalidEmail: 'Invalid email format',
    passwordRequired: 'Password is required',
    welcome: 'Welcome, {name}!',
    incorrectCredentials: 'Incorrect email or password.',
  },
  id: {
    signIn: 'Masuk',
    email: 'Email',
    password: 'Kata Sandi',
    emailRequired: 'Email wajib diisi',
    invalidEmail: 'Format email tidak valid',
    passwordRequired: 'Kata sandi wajib diisi',
    welcome: 'Selamat datang, {name}!',
    incorrectCredentials: 'Email atau kata sandi salah.',
  },
};

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const t = useT(dict);
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
      toast.success(t('welcome', { name: user.full_name.split(' ')[0] }));
      router.push(getDashboardPath(user.roles?.[0]));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(msg || t('incorrectCredentials'));
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

        {/* Language switcher */}
        <div className="absolute right-6 top-5 z-10 flex items-center gap-1 text-[11px] font-semibold">
          <button
            onClick={() => setLocale('en')}
            className={`px-2 py-1 rounded-sm transition-colors ${locale === 'en' ? 'text-navy-700' : 'text-navy-700/30 hover:text-navy-700/60'}`}
          >
            EN
          </button>
          <span className="text-navy-700/20">/</span>
          <button
            onClick={() => setLocale('id')}
            className={`px-2 py-1 rounded-sm transition-colors ${locale === 'id' ? 'text-navy-700' : 'text-navy-700/30 hover:text-navy-700/60'}`}
          >
            ID
          </button>
        </div>

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
            <h1 className="font-display text-navy-700 mb-8 leading-tight text-[1.6rem]">{t('signIn')}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-navy-700/60 uppercase tracking-wider mb-2">{t('email')}</label>
                <input
                  {...register('email', {
                    required: t('emailRequired'),
                    pattern: { value: /\S+@\S+\.\S+/, message: t('invalidEmail') },
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
                <label className="block text-xs font-semibold text-navy-700/60 uppercase tracking-wider mb-2">{t('password')}</label>
                <div className="relative">
                  <input
                    {...register('password', { required: t('passwordRequired') })}
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
                    t('signIn')
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
