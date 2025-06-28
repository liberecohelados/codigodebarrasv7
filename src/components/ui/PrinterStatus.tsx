import React from 'react';

interface Props {
  online: boolean;
  onRetry: () => void;
}

const PrinterStatus: React.FC<Props> = ({ online, onRetry }) => (
  <button
    onClick={onRetry}
    className={`fixed bottom-6 right-6 px-4 py-2 rounded-full shadow-lg shadow-neutral-300/60
      text-white font-medium transition-colors
      ${online ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
  >
    {online ? 'Impresora OK' : 'Sin impresora'}
  </button>
);

export default PrinterStatus;
