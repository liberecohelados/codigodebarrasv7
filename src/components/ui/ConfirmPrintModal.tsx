// src/components/ui/ConfirmPrintModal.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

interface Props {
  open      : boolean;
  offline   : boolean;
  data      : { producto:string; marca:string; lote:string; fechaFab:string; fechaVto:string };
  onKeep    : () => void;
  onReset   : () => void;
}

export default function ConfirmPrintModal({
  open, offline, data, onKeep, onReset
}: Props) {
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
            <h2 className="text-lg font-semibold mb-3 text-neutral-800">
              {offline ? 'Generando etiqueta en modo EMERGENCIA' : '¿Seguir imprimiendo?'}
            </h2>
            <p className="text-sm text-neutral-700 whitespace-pre-line mb-6">
              Generaste la etiqueta de:
              {"\n"}• Producto: <b>{data.producto}</b>
              {"\n"}• Marca: <b>{data.marca}</b>
              {"\n"}• Lote: <b>{data.lote}</b>
              {"\n"}• F. Elab: {data.fechaFab} – F. Vto: {data.fechaVto}
            </p>

            {offline && (
              <p className="text-sm text-red-600 mb-6">
                No tenés impresora conectada.  
                Podés seguir guardando esta etiqueta en Airtable  
                y luego reimprimirla.  
                Conectá la impresora o desactivá el modo emergencia.
              </p>
            )}

            <div className="flex gap-3">
              <Button className="flex-1" onClick={onKeep}>
                {offline ? 'Continuar offline' : 'Mantener y seguir'}
              </Button>
              <Button
                className="flex-1 bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
                onClick={onReset}
              >
                {offline ? 'Salir modo emergencia' : 'Nueva configuración'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
