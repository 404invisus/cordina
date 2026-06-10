'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({ open, onClose, title, subtitle, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; subtitle?: string;
  children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={cn('relative bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full overflow-hidden', sizes[size])}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#284074] via-[#3d5a9e] to-[#284074]" />
            {title && (
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                <button onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 ml-4 mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className={cn('px-6 pb-6 overflow-y-auto max-h-[70vh]', !title && 'pt-6')}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}