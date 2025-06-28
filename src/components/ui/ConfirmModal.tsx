import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface Props {
  open: boolean;
  resumen: string;
  onKeep: () => void;
  onReset: () => void;
}

const ConfirmPrintModal: React.FC<Props> = ({ open, resumen, onKeep, onReset }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        key="backdrop"
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
          className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-neutral-300/60 p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-neutral-800">
            ¿Seguir imprimiendo?
          </h2>

          <p className="text-sm whitespace-pre-line text-neutral-700">{resumen}</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button onClick={onKeep}  className="w-full">Mantener</Button>
            <Button onClick={onReset} className="w-full bg-[#FF163B] hover:bg-[#e21334]">
              Nueva config.
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmPrintModal;
