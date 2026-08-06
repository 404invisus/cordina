'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, Save, TestTube, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const dict = {
  en: {
    title: 'e-Sign Configuration',
    subtitle: 'Electronic signature integration settings',
    apiCredentials: 'API Credentials',
    baseUrl: 'Base URL',
    username: 'Username',
    password: 'Password',
    leaveEmptyUnchanged: '(leave empty to keep unchanged)',
    apiKey: 'API Key',
    saving: 'Saving...',
    saveConfiguration: 'Save Configuration',
    toastConfigSaved: 'e-Sign configuration saved',
    toastSaveFailed: 'Failed to save',
    connectionTest: 'Connection Test',
    nikForTesting: 'NIK for testing',
    nikPlaceholder: '16 digit NIK',
    testing: 'Testing...',
    testEsignConnection: 'Test e-Sign Connection',
    connectionSuccessful: 'Connection successful',
    authFailed: 'Authentication failed - check username/password/API key',
    connectionFailed: 'Connection failed',
  },
  id: {
    title: 'Konfigurasi Tanda Tangan Elektronik',
    subtitle: 'Pengaturan integrasi tanda tangan elektronik',
    apiCredentials: 'Kredensial API',
    baseUrl: 'URL Dasar',
    username: 'Nama Pengguna',
    password: 'Kata Sandi',
    leaveEmptyUnchanged: '(kosongkan jika tidak ingin diubah)',
    apiKey: 'Kunci API',
    saving: 'Menyimpan...',
    saveConfiguration: 'Simpan Konfigurasi',
    toastConfigSaved: 'Konfigurasi tanda tangan elektronik disimpan',
    toastSaveFailed: 'Gagal menyimpan',
    connectionTest: 'Uji Koneksi',
    nikForTesting: 'NIK untuk pengujian',
    nikPlaceholder: 'NIK 16 digit',
    testing: 'Menguji...',
    testEsignConnection: 'Uji Koneksi Tanda Tangan Elektronik',
    connectionSuccessful: 'Koneksi berhasil',
    authFailed: 'Autentikasi gagal - periksa nama pengguna/kata sandi/kunci API',
    connectionFailed: 'Koneksi gagal',
  },
};

export default function TteConfigPage() {
  const t = useT(dict);
  const [form, setForm] = useState({
    TTE_BASE_URL: '',
    TTE_USERNAME: '',
    TTE_PASSWORD: '',
    TTE_API_KEY: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testNik, setTestNik] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const { isLoading } = useQuery({
    queryKey: ['tte-config'],
    queryFn: () =>
      api.get('/api/v1/tte-config').then((r) => {
        const d = r.data.data;
        setForm({
          TTE_BASE_URL: d.TTE_BASE_URL || '',
          TTE_USERNAME: d.TTE_USERNAME || '',
          TTE_PASSWORD: '',
          TTE_API_KEY: '',
        });
        return d;
      }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: any = { TTE_BASE_URL: form.TTE_BASE_URL, TTE_USERNAME: form.TTE_USERNAME };
      if (form.TTE_PASSWORD) payload.TTE_PASSWORD = form.TTE_PASSWORD;
      if (form.TTE_API_KEY) payload.TTE_API_KEY = form.TTE_API_KEY;
      return api.put('/api/v1/tte-config', payload);
    },
    onSuccess: () => toast.success(t('toastConfigSaved')),
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toastSaveFailed')),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/api/v1/tte-config/test', { nik: testNik }),
    onSuccess: (r) => setTestResult(r.data.data),
    onError: (e: any) => setTestResult({ reachable: false, error: e?.response?.data?.message }),
  });

  const f = (key: string) => (e: any) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const inputCls =
    'w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 font-mono focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-navy-700/8 rounded-[6px] flex items-center justify-center border border-navy-700/10">
            <Shield className="w-5 h-5 text-navy-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{t('title')}</h1>
            <p className="text-sm text-text-placeholder mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Credentials */}
            <div className="bg-white rounded-[6px] border border-border-subtle p-6 space-y-4">
              <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider mb-2">{t('apiCredentials')}</div>

              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('baseUrl')}</label>
                <input
                  value={form.TTE_BASE_URL}
                  onChange={f('TTE_BASE_URL')}
                  className={`mt-1 ${inputCls}`}
                  placeholder="https://esign-dev.layanan.go.id"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('username')}</label>
                <input value={form.TTE_USERNAME} onChange={f('TTE_USERNAME')} className={`mt-1 ${inputCls}`} placeholder="esign" />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  {t('password')} <span className="text-text-placeholder normal-case font-normal">{t('leaveEmptyUnchanged')}</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.TTE_PASSWORD}
                    onChange={f('TTE_PASSWORD')}
                    className={inputCls}
                    placeholder="••••••••••••"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text-secondary"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  {t('apiKey')} <span className="text-text-placeholder normal-case font-normal">{t('leaveEmptyUnchanged')}</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={form.TTE_API_KEY}
                    onChange={f('TTE_API_KEY')}
                    className={inputCls}
                    placeholder="••••••••••••"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text-secondary"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.TTE_BASE_URL || !form.TTE_USERNAME}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? t('saving') : t('saveConfiguration')}
              </button>
            </div>

            {/* Test koneksi */}
            <div className="bg-white rounded-[6px] border border-border-subtle p-6 space-y-4">
              <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider mb-2">{t('connectionTest')}</div>
              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('nikForTesting')}</label>
                <input
                  value={testNik}
                  onChange={(e) => setTestNik(e.target.value)}
                  className={`mt-1 ${inputCls}`}
                  placeholder={t('nikPlaceholder')}
                  maxLength={16}
                />
              </div>

              <button
                onClick={() => {
                  setTestResult(null);
                  testMutation.mutate();
                }}
                disabled={testMutation.isPending || !testNik}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] border-2 border-navy-700/20 text-navy-900 text-sm font-semibold hover:bg-navy-700/8 disabled:opacity-50 transition-all"
              >
                <TestTube className="w-4 h-4" />
                {testMutation.isPending ? t('testing') : t('testEsignConnection')}
              </button>

              {testResult && (
                <div
                  className={`p-4 rounded-[6px] border ${testResult.reachable && testResult.status < 400 ? 'bg-success-soft border-success-soft' : 'bg-danger-soft border-danger-soft'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.reachable && testResult.status < 400 ? (
                      <CheckCircle2 className="w-4 h-4 text-success-text" />
                    ) : (
                      <XCircle className="w-4 h-4 text-danger" />
                    )}
                    <span className={`text-sm font-semibold ${testResult.reachable ? 'text-success-text' : 'text-danger-text'}`}>
                      {testResult.reachable && testResult.status < 400
                        ? t('connectionSuccessful')
                        : testResult.status === 401
                          ? t('authFailed')
                          : t('connectionFailed')}
                    </span>
                    {testResult.status && <span className="text-xs text-text-placeholder font-mono">HTTP {testResult.status}</span>}
                  </div>
                  {testResult.error && <div className="text-xs text-danger-text mt-1">{testResult.error}</div>}
                  {testResult.response && (
                    <pre className="text-xs text-text-secondary mt-2 bg-white/60 rounded-lg p-2 overflow-x-auto">
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
