'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, Save, TestTube, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function TteConfigPage() {
  const [form, setForm] = useState({
    TTE_BASE_URL: '',
    TTE_USERNAME: '',
    TTE_PASSWORD: '',
    TTE_API_KEY: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [testNik, setTestNik]   = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const { isLoading } = useQuery({
    queryKey: ['tte-config'],
    queryFn: () => api.get('/api/v1/tte-config').then(r => {
      const d = r.data.data;
      setForm({
        TTE_BASE_URL: d.TTE_BASE_URL || '',
        TTE_USERNAME: d.TTE_USERNAME || '',
        TTE_PASSWORD: '',
        TTE_API_KEY:  '',
      });
      return d;
    }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: any = { TTE_BASE_URL: form.TTE_BASE_URL, TTE_USERNAME: form.TTE_USERNAME };
      if (form.TTE_PASSWORD) payload.TTE_PASSWORD = form.TTE_PASSWORD;
      if (form.TTE_API_KEY)  payload.TTE_API_KEY  = form.TTE_API_KEY;
      return api.put('/api/v1/tte-config', payload);
    },
    onSuccess: () => toast.success('Konfigurasi TTE disimpan'),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menyimpan'),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/api/v1/tte-config/test', { nik: testNik }),
    onSuccess: (r) => setTestResult(r.data.data),
    onError: (e: any) => setTestResult({ reachable: false, error: e?.response?.data?.message }),
  });

  const f = (key: string) => (e: any) => setForm(p => ({ ...p, [key]: e.target.value }));
  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Konfigurasi TTE</h1>
            <p className="text-sm text-slate-400 mt-0.5">Pengaturan integrasi Tanda Tangan Elektronik</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Credentials */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kredensial API</div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base URL</label>
                <input value={form.TTE_BASE_URL} onChange={f('TTE_BASE_URL')} className={`mt-1 ${inputCls}`}
                  placeholder="https://esign-dev.layanan.go.id" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                <input value={form.TTE_USERNAME} onChange={f('TTE_USERNAME')} className={`mt-1 ${inputCls}`}
                  placeholder="esign" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Password <span className="text-slate-400 normal-case font-normal">(kosongkan jika tidak diubah)</span>
                </label>
                <div className="relative mt-1">
                  <input type={showPass ? 'text' : 'password'} value={form.TTE_PASSWORD} onChange={f('TTE_PASSWORD')}
                    className={inputCls} placeholder="••••••••••••" />
                  <button onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  API Key <span className="text-slate-400 normal-case font-normal">(kosongkan jika tidak diubah)</span>
                </label>
                <div className="relative mt-1">
                  <input type={showKey ? 'text' : 'password'} value={form.TTE_API_KEY} onChange={f('TTE_API_KEY')}
                    className={inputCls} placeholder="••••••••••••" />
                  <button onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.TTE_BASE_URL || !form.TTE_USERNAME}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] disabled:opacity-50 transition-all">
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </button>
            </div>

            {/* Test koneksi */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Test Koneksi</div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NIK untuk test</label>
                <input value={testNik} onChange={e => setTestNik(e.target.value)} className={`mt-1 ${inputCls}`}
                  placeholder="16 digit NIK" maxLength={16} />
              </div>

              <button onClick={() => { setTestResult(null); testMutation.mutate(); }}
                disabled={testMutation.isPending || !testNik}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-violet-200 text-violet-700 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50 transition-all">
                <TestTube className="w-4 h-4" />
                {testMutation.isPending ? 'Menguji...' : 'Test Koneksi TTE'}
              </button>

              {testResult && (
                <div className={`p-4 rounded-xl border ${testResult.reachable && testResult.status < 400 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.reachable && testResult.status < 400
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className={`text-sm font-semibold ${testResult.reachable ? 'text-emerald-700' : 'text-red-600'}`}>
                      {testResult.reachable && testResult.status < 400 ? 'Koneksi berhasil' : testResult.status === 401 ? 'Autentikasi gagal, periksa username/password/API key' : 'Koneksi gagal'}
                    </span>
                    {testResult.status && <span className="text-xs text-slate-400 font-mono">HTTP {testResult.status}</span>}
                  </div>
                  {testResult.error && <div className="text-xs text-red-600 mt-1">{testResult.error}</div>}
                  {testResult.response && (
                    <pre className="text-xs text-slate-600 mt-2 bg-white/60 rounded-lg p-2 overflow-x-auto">
                      {JSON.stringify(testResult.response, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
