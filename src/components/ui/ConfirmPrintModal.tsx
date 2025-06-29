import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

interface Props {
  open: boolean;
  data: {
    producto: string;
    marca: string;
    lote: string;
    fechaFab: string;
    fechaVto: string;
  };
  onKeep: () => void;
  onReset: () => void;
}

export default function ConfirmPrintModal({ open, data, onKeep, onReset }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-3 text-neutral-800">Aviso Importante</h2>
            <p className="text-sm text-neutral-700 mb-4 whitespace-pre-line">
              Estás intentando generar la siguiente etiqueta:
              {'\n'}• Producto: <b>{data.producto}</b>
              {'\n'}• Marca: <b>{data.marca}</b>
              {'\n'}• Lote: <b>{data.lote}</b>
              {'\n'}• F. Elab: <b>{data.fechaFab}</b> – F. Vto: <b>{data.fechaVto}</b>
              {'\n'}
              {'\n'}Pero no es posible porque no tenés la impresora conectada.
              {'\n'}Por favor, conecta la impresora para continuar con la impresión.
            </p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={onKeep}>Refrescar</Button>
              <Button className="flex-1 bg-black text-white hover:bg-neutral-800" onClick={onReset}>
                Activar modo emergencia
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
