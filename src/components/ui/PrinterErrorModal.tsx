// src/components/ui/PrinterErrorModal.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

interface Props {
  open     : boolean;
  onRetry  : () => void;
  onOffline: () => void;
  onClose  : () => void;
}

export default function PrinterErrorModal({ open, onRetry, onOffline, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale:.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.9, opacity:0 }}
            transition={{ type:'spring', stiffness:260, damping:20 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-3 text-neutral-800">❗ Aviso importante</h2>
            <p className="text-sm text-neutral-700 mb-6 whitespace-pre-line">
              Estas intentando generar la siguiente etiqueta:
              {"\n"}• Producto: <b>{/* producto */}</b>
              {"\n"}• Marca: <b>{/* marca */}</b>
              {"\n"}• Lote: <b>{/* lote */}</b>
              {"\n"}• F. Elab: {/* fab */} – F. Vto: {/* vto */}
              {"\n\n"}Pero no es posible porque no tenés la impresora conectada.
              {"\n"}Por favor conecta la impresora o:
            </p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={onRetry}>
                Refrescar y reintentar
              </Button>
              <Button
                className="flex-1 bg-neutral-800 text-white hover:bg-neutral-900"
                onClick={onOffline}
              >
                Activar modo emergencia
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
