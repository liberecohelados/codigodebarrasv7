import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  online : boolean;
  onRetry: () => void;
}

const ScaleStatus: React.FC<Props> = ({ online, onRetry }) => (
  <div
    onClick={onRetry}
    title={online ? 'Báscula conectada' :
                    'Báscula no detectada. Click para reintentar'}
    className="fixed bottom-6 right-24 z-50 flex items-center gap-1
               cursor-pointer select-none text-sm text-neutral-700"
  >
    <span
      className={`block w-3 h-3 rounded-full border-2 border-white shadow-md
        ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
    />
    <Info className="w-4 h-4 text-neutral-500" />
  </div>
);

export default ScaleStatus;
