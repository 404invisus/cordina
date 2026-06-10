'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Clock, CheckCircle2, AlertTriangle, Upload, X, FileText } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { attendanceService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  hadir:        { label: 'Hadir',          bg: 'bg-emerald-50', text: 'text-emerald-600' },
  terlambat:    { label: 'Terlambat',      bg: 'bg-amber-50',   text: 'text-amber-600' },
  pulang_cepat: { label: 'Pulang Cepat',   bg: 'bg-orange-50',  text: 'text-orange-600' },
  dinas_luar:   { label: 'Dinas Luar',     bg: 'bg-blue-50',    text: 'text-blue-600' },
  cuti:         { label: 'Cuti',           bg: 'bg-violet-50',  text: 'text-violet-600' },
  wfh:          { label: 'WFH',            bg: 'bg-sky-50',     text: 'text-sky-600' },
  diluar_radius:{ label: 'Di Luar Radius', bg: 'bg-red-50',     text: 'text-red-600' },
};

const WORKMODE_CONFIG: Record<string, { label: string; needsGPS: boolean; needsFile: boolean }> = {
  wfo:        { label: 'WFO (Masuk Kantor)', needsGPS: true,  needsFile: false },
  wfh:        { label: 'WFH',               needsGPS: false, needsFile: false },
  dinas_luar: { label: 'Dinas Luar',        needsGPS: false, needsFile: true  },
  cuti:       { label: 'Cuti',              needsGPS: false, needsFile: true  },
};

function ClockButton({ type, disabled, onClock, loading }: any) {
  const isIn = type === 'clock_in';
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClock}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-3 shadow-sm ${
        disabled
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : isIn
          ? 'bg-[#284074] text-white hover:bg-[#1e3260]'
          : 'bg-emerald-500 text-white hover:bg-emerald-600'
      }`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <Clock className="w-5 h-5" />
          {isIn ? 'Clock In' : 'Clock Out'}
        </>
      )}
    </motion.button>
  );
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [workMode, setWorkMode] = useState('wfo');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const isAdmin = user?.roles?.some(r => ['kepala_balai', 'kepala_seksi', 'administrator'].includes(r));

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceService.today().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const { data: historyData } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: () => attendanceService.history({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) }).then(r => r.data.data?.data || []),
  });

  const clockInMutation = useMutation({
    mutationFn: (fd: FormData) => attendanceService.clockIn(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance-today'] }); qc.invalidateQueries({ queryKey: ['attendance-history'] }); toast.success('Clock-in berhasil!'); setNotes(''); setFile(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal clock-in'),
  });

  const clockOutMutation = useMutation({
    mutationFn: (data: any) => attendanceService.clockOut(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance-today'] }); qc.invalidateQueries({ queryKey: ['attendance-history'] }); toast.success('Clock-out berhasil!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal clock-out'),
  });

  const handleClockIn = () => {
    const needsGPS = WORKMODE_CONFIG[workMode]?.needsGPS;
    if (needsGPS) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingLocation(false);
          const fd = new FormData();
          fd.append('work_mode', workMode);
          fd.append('latitude', String(pos.coords.latitude));
          fd.append('longitude', String(pos.coords.longitude));
          if (notes) fd.append('notes', notes);
          if (file) fd.append('file', file);
          clockInMutation.mutate(fd);
        },
        () => { setGettingLocation(false); toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif.'); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const fd = new FormData();
      fd.append('work_mode', workMode);
      if (notes) fd.append('notes', notes);
      if (file) fd.append('file', file);
      clockInMutation.mutate(fd);
    }
  };

  const handleClockOut = () => {
    const clockInRecord = todayData?.clock_in;
    if (clockInRecord?.work_mode === 'wfo') {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingLocation(false);
          clockOutMutation.mutate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => { setGettingLocation(false); toast.error('Gagal mendapatkan lokasi.'); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      clockOutMutation.mutate({});
    }
  };

  const clockIn  = todayData?.clock_in;
  const clockOut = todayData?.clock_out;
  const canClockIn  = todayData?.can_clock_in;
  const canClockOut = todayData?.can_clock_out;

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl flex items-center justify-center border border-emerald-100">
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Absensi</h1>
          <p className="text-sm text-slate-400 mt-0.5">{dateStr}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clock In/Out Panel */}
        <div className="space-y-4">
          {/* Status hari ini */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-700">Status Hari Ini</span>
              <span className="text-2xl font-bold text-slate-900 font-mono">{timeStr}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Clock In</div>
                {clockIn ? (
                  <>
                    <div className="text-lg font-bold text-slate-900">{clockIn.time?.slice(0,5)}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CONFIG[clockIn.status]?.bg} ${STATUS_CONFIG[clockIn.status]?.text}`}>
                      {STATUS_CONFIG[clockIn.status]?.label}
                    </span>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">Belum clock-in</div>
                )}
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Clock Out</div>
                {clockOut ? (
                  <>
                    <div className="text-lg font-bold text-slate-900">{clockOut.time?.slice(0,5)}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CONFIG[clockOut.status]?.bg} ${STATUS_CONFIG[clockOut.status]?.text}`}>
                      {STATUS_CONFIG[clockOut.status]?.label}
                    </span>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">Belum clock-out</div>
                )}
              </div>
            </div>

            {canClockIn && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mode Kerja</label>
                  <select value={workMode} onChange={e => { setWorkMode(e.target.value); setFile(null); }}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
                    {Object.entries(WORKMODE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {WORKMODE_CONFIG[workMode]?.needsFile && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Upload Surat {workMode === 'cuti' ? 'Cuti' : 'Dinas'}
                    </label>
                    {file ? (
                      <div className="mt-1 flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 flex-1 truncate">{file.name}</span>
                        <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => fileRef.current?.click()}
                        className="mt-1 w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-[#284074]/30 hover:text-[#284074] transition-colors">
                        <Upload className="w-4 h-4" />
                        Pilih file
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>
                )}

                {WORKMODE_CONFIG[workMode]?.needsGPS && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 px-3 py-2 rounded-xl">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    GPS akan diakses saat clock-in. Pastikan dalam radius 200m dari kantor.
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan (opsional)</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..."
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
                </div>
              </div>
            )}

            {clockIn && clockIn.work_mode && (
              <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-semibold ${STATUS_CONFIG[clockIn.work_mode === 'dinas_luar' ? 'dinas_luar' : clockIn.work_mode === 'cuti' ? 'cuti' : 'wfh']?.bg || 'bg-slate-50'} ${STATUS_CONFIG[clockIn.work_mode === 'dinas_luar' ? 'dinas_luar' : clockIn.work_mode === 'cuti' ? 'cuti' : 'wfh']?.text || 'text-slate-600'}`}>
                Mode: {WORKMODE_CONFIG[clockIn.work_mode]?.label}
                {clockIn.distance_from_office > 0 && ` · ${clockIn.distance_from_office}m dari kantor`}
              </div>
            )}

            <ClockButton type="clock_in"  disabled={!canClockIn}  onClock={handleClockIn}  loading={gettingLocation || clockInMutation.isPending} />
            {canClockOut && (
              <div className="mt-2">
                <ClockButton type="clock_out" disabled={!canClockOut} onClock={handleClockOut} loading={clockOutMutation.isPending} />
              </div>
            )}
          </div>
        </div>

        {/* Riwayat */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Riwayat 30 Hari Terakhir</span>
          </div>
          <div className="overflow-y-auto max-h-96">
            {!historyData || historyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">Belum ada riwayat absensi</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {historyData.map((rec: any, i: number) => {
                  const sc = STATUS_CONFIG[rec.status] || STATUS_CONFIG.hadir;
                  return (
                    <motion.div key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-700">
                          {new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {rec.type === 'clock_in' ? 'Masuk' : 'Pulang'} · {rec.time?.slice(0,5)}
                          {rec.work_mode !== 'wfo' && ` · ${WORKMODE_CONFIG[rec.work_mode]?.label}`}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
