'use client';
import { motion } from 'framer-motion';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center pt-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          {danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-red-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-amber-500">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200'
                : 'bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-200'
            }`}
          >
            Konfirmasi
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}