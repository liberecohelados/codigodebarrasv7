import React from 'react';
import InfoIcon from './InfoIcon';

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
    <InfoIcon className="w-4 h-4 text-neutral-500" />
  </div>
);

export default PrinterStatus;
