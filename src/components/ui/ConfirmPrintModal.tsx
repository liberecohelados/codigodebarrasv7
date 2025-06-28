import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

interface Props {
  open      : boolean;
  resumen   : string;       // texto que describe lo impreso
  onKeep    : () => void;   // continuar con la misma config
  onRestart : () => void;   // recargar todo
}

const ConfirmPrintModal: React.FC<Props> = ({
  open, resumen, onKeep, onRestart,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          key="card"
          className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-neutral-300/60 p-6"
          initial={{ scale: .9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: .9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <h2 className="text-lg font-semibold mb-2 text-neutral-800">
            ¿Cómo seguimos?
          </h2>

          <p className="text-sm text-neutral-600 whitespace-pre-line mb-6">
            Ya se imprimió la etiqueta de:\n{resumen}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Button onClick={onKeep} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Seguir con lo mismo
            </Button>
            <Button onClick={onRestart} className="w-full bg-[#FF163B] hover:bg-[#e21334]">
              Cargar nuevo
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmPrintModal;
