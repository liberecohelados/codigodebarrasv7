import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function Modal({ open, title, message, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">{title}</h2>
            <p className="text-base text-neutral-700 mb-6 whitespace-pre-line">
              {message}
            </p>
            <Button onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
