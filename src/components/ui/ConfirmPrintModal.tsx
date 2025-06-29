import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

interface Props {
  open    : boolean;
  offline : boolean;
  data    : {
    producto: string;
    marca   : string;
    lote    : string;
    fechaFab: string;
    fechaVto: string;
  };
  onKeep  : () => void;
  onReset : () => void;
}

export default function ConfirmPrintModal({ open, offline, data, onKeep, onReset }: Props) {
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
            {offline ? (
              <>
                <h2 className="text-lg font-semibold mb-3 text-neutral-800">
                  Generando etiqueta en modo EMERGENCIA
                </h2>
                <p className="text-sm text-neutral-700 whitespace-pre-line mb-6">
                  Generaste la etiqueta de:
                  {'\n'}• Producto: <b>{data.producto}</b>
                  {'\n'}• Marca: <b>{data.marca}</b>
                  {'\n'}• Lote: <b>{data.lote}</b>
                  {'\n'}• F. Elab: {data.fechaFab} – F. Vto: {data.fechaVto}
                  {'\n\n'}
                  <span className="text-red-600">
                    No tenés impresora conectada. Podés seguir guardando esta etiqueta en Airtable y luego reimprimirla. Conectá la impresora o desactivá el modo emergencia.
                  </span>
                </p>
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={onKeep}>
                    Continuar offline
                  </Button>
                  <Button className="flex-1 bg-black text-white hover:bg-gray-800" onClick={onReset}>
                    Salir modo emergencia
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-3 text-neutral-800">
                  ¿Seguir imprimiendo?
                </h2>
                <p className="text-sm text-neutral-700 whitespace-pre-line mb-6">
                  Estás queriendo generar la siguiente etiqueta:
                  {'\n'}• Producto: <b>{data.producto}</b>
                  {'\n'}• Marca: <b>{data.marca}</b>
                  {'\n'}• Lote: <b>{data.lote}</b>
                  {'\n'}• F. Elab: {data.fechaFab} – F. Vto: {data.fechaVto}
                  {'\n\n'}
                  <span className="text-red-600">
                    Pero no es posible porque no tenés la impresora conectada.
                  </span>
                </p>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={() => window.location.reload()}>
                    Refrescar e intentar conectar
                  </Button>
                  <Button className="flex-1 bg-black text-white hover:bg-gray-800" onClick={onKeep}>
                    Activar modo emergencia
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
