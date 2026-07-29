'use client';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center pt-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-danger-soft' : 'bg-warning-soft'}`}>
          {danger
            ? <AlertTriangle className="w-7 h-7 text-danger" />
            : <Info className="w-7 h-7 text-warning" />
          }
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-danger hover:bg-red-600 shadow-sm shadow-red-200'
                : 'bg-warning hover:bg-amber-600 shadow-sm shadow-amber-200'
            }`}
          >
            Confirm
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
