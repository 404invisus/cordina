'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/utils';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router     = useRouter();
  const setAuth    = useAuthStore(s => s.setAuth);
  const updateUser = useAuthStore(s => s.updateUser);
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

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
      toast.success(`Selamat datang, ${user.full_name.split(' ')[0]}.`);
      router.push(getDashboardPath(user.roles?.[0]));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: '"Source Sans 3", "Source Sans Pro", system-ui, sans-serif' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;500;600&display=swap');
      `}</style>

      {/* Kiri — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#083858] px-12 py-10">
<div />

        <div className="flex items-center justify-center">
          <img src="/logo-only-white.png" alt="Cordina" width={120} height={120} className="object-contain opacity-10" />
        </div>

        <p className="text-white/20 text-xs">
          Balai Layanan Penghubung Identitas Digital
        </p>
      </div>

      {/* Kanan — form */}
      <div className="flex-1 flex flex-col bg-[#f4f2ee]">
        {/* Mobile nav */}
        <div className="lg:hidden px-6 py-5 flex items-center gap-2 border-b border-[#083858]/8">
          <img src="/logo-only-black.png" alt="Cordina" width={20} height={20} className="object-contain" />
          <span className="font-semibold text-[#083858] text-sm">Cordina</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-sm"
          >
            <h1
              className="text-[#083858] mb-8 leading-tight"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.6rem' }}
            >
              Masuk
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#083858]/60 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  {...register('email', {
                    required: 'Email wajib diisi',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Format email tidak valid' },
                  })}
                  type="email"
                  placeholder="nama@bssn.go.id"
                  autoComplete="email"
                  className={`w-full px-4 py-3 border-b-2 bg-transparent text-sm text-[#0d1f2d] placeholder:text-[#083858]/25 outline-none transition-colors ${
                    errors.email
                      ? 'border-[#e81749]'
                      : 'border-[#083858]/15 focus:border-[#083858]'
                  }`}
                />
                {errors.email && (
                  <p className="text-[#e81749] text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#083858]/60 uppercase tracking-wider mb-2">
                  Kata sandi
                </label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Kata sandi wajib diisi' })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-10 border-b-2 bg-transparent text-sm text-[#0d1f2d] placeholder:text-[#083858]/25 outline-none transition-colors ${
                      errors.password
                        ? 'border-[#e81749]'
                        : 'border-[#083858]/15 focus:border-[#083858]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#083858]/30 hover:text-[#083858]/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#e81749] text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center bg-[#083858] text-white py-3 text-sm font-semibold hover:bg-[#0d4a72] focus:outline-none focus:ring-2 focus:ring-[#3fa3d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : 'Masuk'}
                </button>
              </div>
            </form>

            <p className="text-xs text-[#083858]/35 mt-8">
              Belum punya akses? Hubungi administrator sistem.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
