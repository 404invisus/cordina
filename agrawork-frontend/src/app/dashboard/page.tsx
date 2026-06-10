'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { primaryRole } = useAuthStore();
  useEffect(() => {
    router.replace(getDashboardPath(primaryRole() || 'staff'));
  }, []);
  return <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
  </div>;
}
