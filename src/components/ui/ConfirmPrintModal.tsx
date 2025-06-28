import React from 'react';
import Modal from './Modal';

interface Props {
  open: boolean;
  summary: string;
  onKeep : () => void;
  onReset: () => void;
}

const ConfirmPrintModal: React.FC<Props> = ({ open, summary, onKeep, onReset }) => (
  <Modal
    open={open}
    title="¿Mantener configuración?"
    message={`Se imprimió:\n${summary}\n\n¿Deseás seguir con la MISMA configuración?`}
    onClose={onReset}
  >
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button onClick={onKeep}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2 font-medium">
        Mantener
      </button>
      <button onClick={onReset}
        className="w-full bg-brand hover:bg-brand-dark text-white rounded-xl py-2 font-medium">
        Nueva config.
      </button>
    </div>
  </Modal>
);

export default ConfirmPrintModal;
