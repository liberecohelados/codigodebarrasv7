import React from 'react';

interface Props { online: boolean; onRetry: () => void }

const InfoIcon = () => (
  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth={2}
       viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
       d="M12 9v2m0 4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/></svg>
);

const ScaleStatus: React.FC<Props> = ({ online, onRetry }) => (
  <div
    onClick={onRetry}
    title={online ? 'Báscula conectada' : 'Báscula no detectada. Click para reintentar'}
    className="fixed bottom-6 right-16 z-50 flex items-center gap-1 cursor-pointer select-none"
  >
    <span className={`w-3 h-3 rounded-full border-2 border-white shadow-md
      ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
    <InfoIcon />
  </div>
);

export default ScaleStatus;
