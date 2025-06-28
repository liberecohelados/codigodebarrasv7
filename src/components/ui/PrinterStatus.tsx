import React from 'react';

/** icono “i” (svg inline) */
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-neutral-500">
    <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm.75 15h-1.5v-6h1.5v6Zm0-8h-1.5V7h1.5v2Z"/>
  </svg>
);

interface Props {
  online : boolean;
  onRetry: () => void;
}

const PrinterStatus: React.FC<Props> = ({ online, onRetry }) => (
  <div
    onClick={onRetry}
    title={online ? 'Impresora conectada' : 'Impresora no detectada. Click para reintentar'}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-1 cursor-pointer select-none"
  >
    <span
      className={`block w-3 h-3 rounded-full border-2 border-white shadow-md
                  ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
    />
    <InfoIcon />
  </div>
);

export default PrinterStatus;
