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
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            key="card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">
              ¿Seguir imprimiendo?
            </h2>
            <div className="text-base text-neutral-700 mb-6">
              <p className="mb-2">Generaste la etiqueta de:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-800">
                <li><span className="font-medium">Producto:</span> {data.producto}</li>
                <li><span className="font-medium">Marca:</span> {data.marca}</li>
                <li><span className="font-medium">Lote:</span> {data.lote}</li>
                <li>
                  <span className="font-medium">F. Elab:</span> {data.fechaFab}  
                  <span className="ml-4 font-medium">F. Vto:</span> {data.fechaVto}
                </li>
              </ul>
            </div>
            <div className="flex gap-4">
              <Button className="flex-1" onClick={onKeep}>
                Mantener y seguir
              </Button>
              <Button
                className="flex-1 bg-black text-white hover:bg-neutral-800"
                onClick={onReset}
              >
                Nueva configuración
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
