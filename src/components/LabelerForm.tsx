// src/components/LabelerForm.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getContador,
  getProductos,
  getMarcas,
  postImpresion,
  patchContador,
} from '../services/airtable';
import { buildCodigo21 } from '../utils/formatters';

import Button        from './ui/Button';
import Dropdown      from './ui/Dropdown';
import Toast         from './ui/Toast';
import PrinterStatus from './ui/PrinterStatus';
import ScaleStatus   from './ui/ScaleStatus';
import ConfirmPrint  from './ui/ConfirmPrintModal';

const SECRET = 'modolocalactivado';

interface Product {
  id: string;
  label: string;
  codigo: string;
  ingredientes: string;
  marcasIds: string[];
  rne: string;
  rnpa: string;
}
interface Marca {
  id: string;
  label: string;
  indicador: number;
}

export default function LabelerForm() {
  /* state */
  const [productos, setProductos] = useState<Product[]>([]);
  const [marcas, setMarcas]        = useState<Marca[]>([]);
  const [contador, setContador]    = useState<{ id: string; nextId: number } | null>(null);

  const [form, setForm] = useState({
    productoId: '',
    marcaId: '',
    lote: '',
    fechaFab: '',
    fechaVto: '',
    peso: 0,
  });

  const [toast, setToast]                   = useState({ visible: false, message: '' });
  const [printerOk, setPrinterOk]           = useState(false);
  const [scaleOk, setScaleOk]               = useState(false);
  const [offlineMode, setOfflineMode]       = useState(false);
  const [keyBuffer, setKeyBuffer]           = useState('');
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [lastPrint, setLastPrint]           = useState<any>(null);
  const [noPrinterModalOpen, setNoPrinter]  = useState(false);

  /* secret‐key listener */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const kb = (keyBuffer + e.key).slice(-SECRET.length);
      setKeyBuffer(kb);
      if (kb === SECRET) {
        setOfflineMode(m => !m);
        setKeyBuffer('');
        alert(`Modo offline ${!offlineMode ? 'activado' : 'desactivado'}`);
      }
    };
    window.addEventListener('keypress', onKey);
    return () => window.removeEventListener('keypress', onKey);
  }, [keyBuffer, offlineMode]);

  /* initial load */
  useEffect(() => {
    (async () => {
      setContador(await getContador());
      setProductos(await getProductos());
      setMarcas(await getMarcas());
      const hoy = new Date();
      const vto = new Date(); vto.setFullYear(vto.getFullYear() + 2);
      setForm(f => ({
        ...f,
        fechaFab: hoy.toISOString().slice(0, 10),
        fechaVto: vto.toISOString().slice(0, 10),
      }));
    })();
  }, []);

  const handleChange = (e: any) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.name === 'peso' ? +e.target.value : e.target.value }));

  /* scale connect */
  const handleConnectScale = async () => {
    try {
      if (!('serial' in navigator)) throw new Error();
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      const rdr = port.readable.pipeThrough(new TextDecoderStream()).getReader();
      setScaleOk(true);
      while (true) {
        const { value, done } = await rdr.read();
        if (done) break;
        const m = /([\d.]+)/.exec(value);
        if (m) setForm(f => ({ ...f, peso: Math.round(parseFloat(m[1]) * 1000) }));
      }
    } catch {
      setScaleOk(false);
      alert('No se pudo conectar a la báscula');
    }
  };
  const handleConnectBT = async () => {
    try {
      if (!('bluetooth' in navigator)) throw new Error();
      await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
      setScaleOk(true);
    } catch {
      setScaleOk(false);
      alert('Error Bluetooth');
    }
  };

  /* print logic */
  const handlePrint = async () => {
    if (!contador) return;
    const prod = productos.find(p => p.id === form.productoId);
    const mkt = marcas.find(m => m.id === form.marcaId);
    if (!prod || !mkt) return alert('Seleccione producto y marca');

    const idLata = contador.nextId;
    const codigo21 = buildCodigo21({
      idLata,
      lote: form.lote,
      indicador: mkt.indicador,
      codigoProducto: prod.codigo,
      pesoGramos: form.peso,
    });

    const zpl = [
      '^XA^CI28','^PW800','^LL480',
      `^FO20,20^A0N,60,60^FD${prod.label.toUpperCase()}^FS`,
      '^FO20,100^GB760,40,40^FS',
      `^FO40,110^A0N,40,40^FD${mkt.label}^FS`,
      `^FO20,160^A0N,28,28^FD${prod.ingredientes.replace(/\./g,'').slice(0,112)}^FS`,
      `^FO20,220^A0N,28,28^FDRNE ${prod.rne}  RNPA ${prod.rnpa}^FS`,
      `^FO20,260^A0N,28,28^FDF. ELAB: ${form.fechaFab}^FS`,
      `^FO400,260^A0N,28,28^FDF. VTO: ${form.fechaVto}^FS`,
      `^FO20,300^A0N,28,28^FDLOTE: ${form.lote}^FS`,
      '^FO20,330^GB760,3,3^FS',
      `^FO20,340^BY3^BCN,120,Y,N,N^FD${codigo21}^FS`,
      `^FO20,465^A0N,28,28^FB760,1,0,C,0^FD${codigo21}^FS`,
      '^XZ',
    ].join('\n');

    // OFFLINE MODE: sólo post & counter
    if (offlineMode) {
      await postImpresion({
        id_lata: idLata, lote: +form.lote, marca: mkt.label,
        producto: prod.label, peso_g: form.peso,
        rne: prod.rne, rnpa: prod.rnpa,
        codigo21, fecha_fab: form.fechaFab, fecha_vto: form.fechaVto,
      });
      await patchContador(contador.id, idLata + 1);
      setContador({ id: contador.id, nextId: idLata + 1 });
      setToast({ visible: true, message: '¡Datos guardados en Airtable (offline)!' });
      return setTimeout(() => setToast({ visible: false, message: '' }), 3000);
    }

    // NORMAL MODE: chequeo impresora
    const hasBrowserPrint = !!(window as any).BrowserPrint;
    if (!hasBrowserPrint) {
      return setNoPrinter(true);
    }
    (window as any).BrowserPrint.getDefaultDevice('printer', async (p: any) => {
      if (!p) {
        return setNoPrinter(true);
      }
      // TODO: aquí podes validar status si querés antes
      // POST + COUNTER
      await postImpresion({
        id_lata: idLata, lote: +form.lote, marca: mkt.label,
        producto: prod.label, peso_g: form.peso,
        rne: prod.rne, rnpa: prod.rnpa,
        codigo21, fecha_fab: form.fechaFab, fecha_vto: form.fechaVto,
      });
      await patchContador(contador.id, idLata + 1);
      setContador({ id: contador.id, nextId: idLata + 1 });

      // SEND
      setPrinterOk(true);
      p.send(zpl);

      // CONFIRM PRINT
      setLastPrint({
        producto: prod.label,
        marca: mkt.label,
        lote: form.lote,
        fechaFab: form.fechaFab,
        fechaVto: form.fechaVto,
      });
      setConfirmOpen(true);
    });
  };

  return (
    <>
      {/* badges */}
      <PrinterStatus online={printerOk} onRetry={() => window.location.reload()} />
      <ScaleStatus online={scaleOk} onRetry={handleConnectScale} />
      {offlineMode && (
        <div className="fixed bottom-6 right-28 z-50 px-3 py-1 bg-[#FF163B] text-white rounded-full text-xs">
          Modo sin impresora
        </div>
      )}

      <div className="space-y-4">
        {/* Marca */}
        <label className="block text-sm font-medium mb-1">Seleccione Marca</label>
        <Dropdown
          options={marcas.map(m => ({ value: m.id, label: m.label }))}
          value={form.marcaId}
          onChange={val => setForm(f => ({ ...f, marcaId: val, productoId: '' }))}
        />

        {/* Producto */}
        <label className="block text-sm font-medium mb-1">Seleccione Producto</label>
        <Dropdown
          options={productos
            .filter(p => !form.marcaId || p.marcasIds.includes(form.marcaId))
            .map(p => ({ value: p.id, label: p.label }))}
          value={form.productoId}
          onChange={val => setForm(f => ({ ...f, productoId: val }))}
          disabled={!form.marcaId}
        />

        {/* Lote */}
        <div>
          <label className="block text-sm font-medium mb-1">Lote (5 dígitos)</label>
          <input
            name="lote" inputMode="numeric" maxLength={5} pattern="\d{5}"
            placeholder="#####"
            value={form.lote}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-xl border px-3 py-2 ${
              form.lote.length === 5 ? 'border-neutral-200' : 'border-red-500'
            } focus:border-brand focus:ring focus:ring-brand-light focus:ring-opacity-50`}
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date" name="fechaFab" value={form.fechaFab} onChange={handleChange}
            className="mt-1 block w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <input
            type="date" name="fechaVto" value={form.fechaVto} onChange={handleChange}
            className="mt-1 block w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        {/* Báscula */}
        <div className="flex gap-4 justify-center">
          <Button onClick={handleConnectScale}>Conectar Báscula</Button>
          <Button onClick={handleConnectBT}>Báscula BT</Button>
        </div>

        {/* Peso grande */}
        <div className="text-center text-3xl font-semibold tracking-wide">{form.peso} g</div>

        <Button onClick={handlePrint}>Imprimir</Button>
      </div>

      <Toast visible={toast.visible} message={toast.message} />

      {/* Modal: no impresora */}
      {noPrinterModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-3">Aviso Importante</h2>
            <p className="text-sm text-neutral-700 mb-4 whitespace-pre-line">
              Estás intentando generar la siguiente etiqueta:{'\n'}
              • Producto: <b>{lastPrint?.producto || form.productoId}</b>{'\n'}
              • Marca: <b>{lastPrint?.marca || form.marcaId}</b>{'\n'}
              • Lote: <b>{form.lote}</b>{'\n'}
              • F. Elab: {form.fechaFab} – F. Vto: {form.fechaVto}{'\n\n'}
              Pero no es posible porque no tenés la impresora conectada.{'\n'}
              Por favor, conecta la impresora para continuar con la impresión.
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[#FF163B] hover:bg-[#e21334]"
                onClick={() => window.location.reload()}
              >
                Refrescar página
              </Button>
              <Button
                className="flex-1 bg-black text-white hover:bg-gray-800"
                onClick={async () => {
                  setNoPrinter(false);
                  const pw = window.prompt('Ingrese contraseña de emergencia');
                  if (pw === SECRET) {
                    setOfflineMode(true);
                  } else {
                    alert('Contraseña incorrecta');
                  }
                }}
              >
                Activar modo emergencia
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Print Modal (normal print) */}
      <ConfirmPrint
        open={confirmOpen}
        data={lastPrint}
        onKeep={() => {
          setConfirmOpen(false);
          setForm(f => ({ ...f, peso: 0 }));
        }}
        onReset={() => window.location.reload()}
      />
    </>
  );
}
