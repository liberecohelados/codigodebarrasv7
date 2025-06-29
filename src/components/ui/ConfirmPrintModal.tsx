// src/components/ui/ConfirmPrintModal.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

interface Props {
  open: boolean;
  data: { producto: string; marca: string; lote: string; fechaFab: string; fechaVto: string };
  onRefresh: () => void;
  onActivate: () => void;
}

export default function ConfirmPrintModal({ open, data, onRefresh, onActivate }: Props) {
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
            <h2 className="text-xl font-semibold mb-4 text-neutral-800">Aviso Importante</h2>

            <p className="text-sm text-neutral-700 mb-2">
              Estás intentando generar la siguiente etiqueta:
            </p>
            <ul className="list-disc pl-5 mb-4 text-sm text-neutral-700">
              <li>Producto: <strong>{data.producto}</strong></li>
              <li>Marca: <strong>{data.marca}</strong></li>
              <li>Lote: <strong>{data.lote}</strong></li>
              <li>F. Elab: <strong>{data.fechaFab}</strong> – F. Vto: <strong>{data.fechaVto}</strong></li>
            </ul>

            <p className="text-sm text-neutral-700 mb-6">
              Pero no es posible porque no tenés la impresora conectada.<br />
              Por favor, conecta la impresora para continuar con la impresión.
            </p>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={onRefresh}>
                Refrescar
              </Button>
              <Button
                className="flex-1 bg-neutral-800 text-white hover:bg-neutral-900"
                onClick={onActivate}
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
