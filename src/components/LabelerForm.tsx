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
import Modal         from './ui/Modal';
import PrinterStatus from './ui/PrinterStatus';
import ScaleStatus   from './ui/ScaleStatus';
import ConfirmPrintModal from './ui/ConfirmPrintModal';

/* ---------- tipos ---------- */
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

const LabelerForm: React.FC = () => {
  /* ---------- state ---------- */
  const [productos, setProductos] = useState<Product[]>([]);
  const [marcas,    setMarcas]    = useState<Marca[]>([]);
  const [contador,  setContador]  = useState<{ id: string; nextId: number } | null>(null);

  const [form, setForm] = useState({
    productoId: '',
    marcaId: '',
    lote: '',
    fechaFab: '',
    fechaVto: '',
    peso: 0,
  });

  const [toast,          setToast]          = useState({ visible: false, message: '' });
  const [printerOk,      setPrinterOk]      = useState(false);
  const [scaleOk,        setScaleOk]        = useState(false);
  const [printerMissing, setPrinterMissing] = useState(false);
  const [confirmOpen,    setConfirmOpen]    = useState(false);

  /* ---------- carga inicial ---------- */
  useEffect(() => {
    (async () => {
      setContador(await getContador());
      setProductos(await getProductos());
      setMarcas(await getMarcas());

      const hoy = new Date();
      const vto = new Date();
      vto.setFullYear(vto.getFullYear() + 2);

      setForm(f => ({
        ...f,
        fechaFab: hoy.toISOString().slice(0, 10),
        fechaVto: vto.toISOString().slice(0, 10),
      }));
    })();
  }, []);

  /* ---------- handlers ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.name === 'peso' ? +e.target.value : e.target.value }));

  /* Báscula vía WebSerial */
  const handleConnectScale = async () => {
    try {
      if (!('serial' in navigator)) throw new Error('WebSerial no soportado');
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader();
      setScaleOk(true);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const m = /([\d.]+)/.exec(value);
        if (m) setForm(f => ({ ...f, peso: Math.round(parseFloat(m[1]) * 1000) }));
      }
    } catch {
      setScaleOk(false);
      alert('No se pudo conectar la báscula');
    }
  };

  /* Báscula bluetooth demo */
  const handleConnectBT = async () => {
    try {
      await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
      setScaleOk(true);
    } catch {
      setScaleOk(false);
      alert('Error Bluetooth');
    }
  };

  const handlePrint = async () => {
    if (!contador) return;
    const prod = productos.find(p => p.id === form.productoId);
    const mkt  = marcas   .find(m => m.id === form.marcaId);
    if (!prod || !mkt) return alert('Seleccione producto y marca');

    /* código 21 */
    const idLata   = contador.nextId;
    const codigo21 = buildCodigo21({
      idLata,
      lote: form.lote,
      indicador     : mkt.indicador,
      codigoProducto: prod.codigo,
      pesoGramos    : form.peso,
    });

    /* ---------- ZPL ---------- */
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
      '^FO20,340^BY3^BCN,120,Y,N,N^FD'+codigo21+'^FS',
      `^FO20,465^A0N,28,28^FB760,1,0,C,0^FD${codigo21}^FS`,
      '^XZ',
    ].join('\n');

    /* ---------- Airtable ---------- */
    await postImpresion({
      id_lata   : idLata,
      lote      : +form.lote,
      producto  : prod.label,
      marca     : mkt.label,
      peso_g    : form.peso,
      rne       : prod.rne,
      rnpa      : prod.rnpa,
      codigo21,
      fecha_fab : form.fechaFab,
      fecha_vto : form.fechaVto,
    });

    await patchContador(contador.id, idLata + 1);
    setContador({ id: contador.id, nextId: idLata + 1 });

    /* imprimir */
    if ((window as any).BrowserPrint) {
      (window as any).BrowserPrint.getDefaultDevice('printer', (p: any) => {
        if (p) { setPrinterOk(true); p.send(zpl); }
        else   { setPrinterOk(false); setPrinterMissing(true); }
      });
    } else {
      setPrinterOk(false);
      setPrinterMissing(true);
    }

    setToast({ visible: true, message: 'Etiqueta impresa y guardada!' });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);

    /* abrir modal de confirmación */
    setConfirmOpen(true);
  };

  /* ---------- render ---------- */
  return (
    <>
      {/* Indicadores */}
      <PrinterStatus online={printerOk} onRetry={() => window.location.reload()} />
      <ScaleStatus   online={scaleOk}   onRetry={handleConnectScale} />

      <div className="space-y-4">
        {/* Marca */}
        {/* …sin cambios… */}
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
            .filter(p => !form.marcaId || (p.marcasIds || []).includes(form.marcaId))
            .map(p => ({ value: p.id, label: p.label }))}
          value={form.productoId}
          onChange={val => setForm(f => ({ ...f, productoId: val }))}
          disabled={!form.marcaId}
        />

        {/* …lote, fechas, botones, peso… (igual que antes) */}

        <div className="flex gap-4 justify-center">
          <Button onClick={handleConnectScale}>Conectar Báscula</Button>
          <Button onClick={handleConnectBT}>Báscula BT</Button>
        </div>

        <div className="text-center text-3xl font-semibold tracking-wide">{form.peso} g</div>
        <Button onClick={handlePrint}>Imprimir</Button>
      </div>

      <Toast visible={toast.visible} message={toast.message} />

      {/* impresora faltante */}
      <Modal
        open={printerMissing}
        title="Impresora no encontrada"
        message={`No se detectó BrowserPrint o una impresora Zebra.\nInstalá BrowserPrint y recargá la página.`}
        onClose={() => setPrinterMissing(false)}
      />

      {/* confirmación de siguiente impresión */}
      <ConfirmPrintModal
        open={confirmOpen}
        resumen={`${form.lote} · ${form.peso} g\n${form.fechaFab} → ${form.fechaVto}`}
        keep={() => { setConfirmOpen(false); setForm(f => ({ ...f, peso: 0 })); }}
        reset={() => window.location.reload()}
      />
    </>
  );
};

export default LabelerForm;
