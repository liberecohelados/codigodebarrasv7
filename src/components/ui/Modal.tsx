import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const Modal: React.FC<Props> = ({ open, title, message, onClose }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="card"
          initial={{ scale: .9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: .9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-neutral-300/60 p-6"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-2 text-neutral-800">{title}</h2>
          <p className="text-sm text-neutral-600 whitespace-pre-line">{message}</p>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-[#FF163B] hover:bg-[#e21334] text-white rounded-xl py-2 font-medium transition-colors"
          >
            Cerrar
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Modal;
