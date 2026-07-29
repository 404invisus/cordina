'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  danger = true,
  confirmLabel = 'Confirm',
  /** If set, the confirm button stays disabled until the user types this exact word/phrase. */
  typedConfirmation,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  typedConfirmation?: string;
}) {
  const [typed, setTyped] = useState('');
  const locked = !!typedConfirmation && typed !== typedConfirmation;

  const handleClose = () => {
    setTyped('');
    onClose();
  };
  const handleConfirm = () => {
    if (locked) return;
    onConfirm();
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <div className="text-center pt-2">
        <div
          className={`w-14 h-14 rounded-[6px] flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-danger-soft' : 'bg-pending-soft'}`}
        >
          {danger ? <AlertTriangle className="w-7 h-7 text-danger" /> : <Info className="w-7 h-7 text-pending" />}
        </div>

        <h3 className="text-base font-bold text-navy-800 mb-2">{title}</h3>
        <p className="text-sm text-text-tertiary leading-relaxed mb-4">{message}</p>

        {typedConfirmation && (
          <div className="mb-4 text-left">
            <label className="block font-mono text-[9.5px] font-semibold tracking-[0.1em] text-text-muted uppercase mb-1.5">
              Type "{typedConfirmation}" to confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full h-[34px] px-[10px] border border-border-button rounded-[6px] text-[12px] text-navy-800 focus:outline-none focus:border-danger"
              placeholder={typedConfirmation}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 h-[34px] rounded-[6px] border border-border-button text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={locked}
            className={`flex-1 h-[34px] rounded-[6px] text-[12px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              danger
                ? 'bg-white border border-border-button text-danger-text hover:bg-danger-soft hover:border-danger'
                : 'bg-navy-700 text-white hover:bg-navy-900'
            }`}
          >
            {confirmLabel}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
