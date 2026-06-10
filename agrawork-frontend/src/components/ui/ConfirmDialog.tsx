'use client';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-yellow-600'}`} />
        </div>
        <h3 className="font-display font-600 text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">Batal</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
            Konfirmasi
          </button>
        </div>
      </div>
    </Modal>
  );
}
