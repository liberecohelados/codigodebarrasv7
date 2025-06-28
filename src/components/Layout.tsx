import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-start justify-center p-6">
    <div
      className="
        w-full max-w-lg
        bg-white/80 backdrop-blur-sm      /* leve efecto glass */
        shadow-[0_1px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]
        ring-1 ring-neutral-200/70        /* borde suave */
        rounded-2xl
        p-8
      "
    >
      {children}
    </div>
  </div>
);

export default Layout;
