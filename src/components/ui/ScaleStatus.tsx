import React from 'react';

const Icon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-neutral-500">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);

interface Props {
  online : boolean;
  onRetry: () => void;
}

export default function ScaleStatus({ online, onRetry }: Props) {
  return (
    <div
      onClick={onRetry}
      title={online ? 'Báscula conectada' : 'Báscula no detectada – click para reintentar'}
      className="fixed bottom-6 right-16 z-50 flex items-center gap-1 cursor-pointer select-none"
    >
      <span
        className={`w-3 h-3 rounded-full border-2 border-white shadow-md
          ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
      />
      <Icon/>
    </div>
  );
}
