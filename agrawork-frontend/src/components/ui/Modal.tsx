'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Modal
export default function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string;
  children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn('relative bg-white rounded-2xl shadow-2xl w-full', sizes[size])}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-display font-600 text-slate-900">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
