import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  summary: string;
  onSame: () => void;
  onNew:  () => void;
}

const ConfirmModal: React.FC<Props> = ({ open, summary, onSame, onNew }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        key="bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      >
        <motion.div
          key="card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-2 text-neutral-800">
            Etiqueta impresa ✔️
          </h2>

          <p className="text-sm text-neutral-700 whitespace-pre-line">
            {summary}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={onSame}
              className="w-full bg-[#FF163B] hover:bg-[#e21334] text-white rounded-xl py-2 font-medium"
            >
              Mantener datos
            </button>
            <button
              onClick={onNew}
              className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-2 font-medium"
            >
              Nueva configuración
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmModal;
