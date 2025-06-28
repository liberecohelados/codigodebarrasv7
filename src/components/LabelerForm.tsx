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
import ConfirmPrint  from './ui/ConfirmPrintModal';
import PrinterStatus from './ui/PrinterStatus';
import ScaleStatus   from './ui/ScaleStatus';

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
  /* ---------- state principal ---------- */
  const [productos, setProductos] = useState<Product[]>([]);
  const [marcas,    setMarcas]    = useState<Marca[]>([]);
  const [contador,  setContador]  =
    useState<{ id: string; nextId: number } | null>(null);

  const [form, setForm] = useState({
    productoId: '', marcaId: '', lote: '',
    fechaFab: '',   fechaVto: '', peso: 0,
  });

  /* UI helpers */
  const [toast,          setToast]          = useState({ visible:false, message:'' });
  const [printerOk,      setPrinterOk]      = useState(false);
  const [scaleOk,        setScaleOk]        = useState(false);
  const [printerMissing, setPrinterMissing] = useState(false);
  const [confirmOpen,    setConfirmOpen]    = useState(false);

  /* ---------- carga inicial ---------- */
  useEffect(() => {
    (async () => {
      setContador(await getContador());
      setProductos(await getProductos());
      setMarcas   (await getMarcas());

      const hoy = new Date();
      const vto = new Date(); vto.setFullYear(vto.getFullYear() + 2);
      setForm(f => ({ ...f,
        fechaFab: hoy.toISOString().slice(0,10),
        fechaVto: vto.toISOString().slice(0,10),
      }));
    })();
  }, []);

  /* ---------- handlers básicos ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f,
      [e.target.name]: e.target.name==='peso' ? +e.target.value : e.target.value,
    }));

  /* Conexión báscula (serial o BT) */
  const handleConnectScale = async () => {
    try{
      if (!('serial' in navigator)) throw new Error();
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      const rdr = port.readable.pipeThrough(new TextDecoderStream()).getReader();
      setScaleOk(true);
      while (true){
        const { value, done } = await rdr.read(); if (done) break;
        const m = /([\d.]+)/.exec(value);
        if (m) setForm(f => ({ ...f, peso: Math.round(parseFloat(m[1])*1000) }));
      }
    }catch{ setScaleOk(false); alert('No se pudo conectar a la báscula'); }
  };
  const handleConnectBT = async () => {
    try{
      if (!('bluetooth' in navigator)) throw new Error();
      await (navigator as any).bluetooth.requestDevice({ acceptAllDevices:true });
      setScaleOk(true);
    }catch{ setScaleOk(false); alert('Error Bluetooth'); }
  };

  /* ---------- impresión ---------- */
  const handlePrint = async () => {
    if (!contador) return;
    const prod = productos.find(p=>p.id===form.productoId);
    const mkt  = marcas   .find(m=>m.id===form.marcaId);
    if (!prod || !mkt) return alert('Seleccione producto y marca');

    const idLata   = contador.nextId;
    const codigo21 = buildCodigo21({
      idLata,
      lote:form.lote,
      indicador:mkt.indicador,
      codigoProducto:prod.codigo,
      pesoGramos:form.peso,
    });

    /* --------- ZPL --------- */
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

    /* --------- Airtable --------- */
    await postImpresion({
      id_lata:idLata,
      lote:+form.lote,
      marcaLabel:mkt.label,
      productoLabel:prod.label,
      peso:form.peso,
      rne:prod.rne,
      rnpa:prod.rnpa,
      codigo21,
      fechaFab:form.fechaFab,
      fechaVto:form.fechaVto,
    });

    await patchContador(contador.id, idLata+1);
    setContador({ id:contador.id, nextId:idLata+1 });

    /* --------- imprimir --------- */
    if ((window as any).BrowserPrint){
      (window as any).BrowserPrint.getDefaultDevice('printer',(p:any)=>{
        if (p){ setPrinterOk(true); p.send(zpl); }
        else  { setPrinterOk(false); setPrinterMissing(true); }
      });
    }else{ setPrinterOk(false); setPrinterMissing(true); }

    setToast({visible:true, message:'Etiqueta impresa y guardada!'});
    setTimeout(()=>setToast({visible:false,message:''}),3000);

    /* abrir modal “¿seguir?” */
    setConfirmOpen(true);
  };

  /* ---------- helpers modal “seguir” ---------- */
  const resumen = `
Producto : ${productos.find(p=>p.id===form.productoId)?.label ?? ''}
Marca    : ${marcas.find(m=>m.id===form.marcaId)?.label ?? ''}
Lote     : ${form.lote}
----------------------------------
¿Imprimimos con la misma configuración?`;

  const keepSame = () => {
    setConfirmOpen(false);
    setForm(f => ({ ...f, peso: 0 }));
  };
  const resetAll = () => window.location.reload();

  /* ---------- render ---------- */
  return (
    <>
      {/* Indicadores */}
      <PrinterStatus online={printerOk} onRetry={()=>window.location.reload()} />
      <ScaleStatus   online={scaleOk}   onRetry={handleConnectScale} />

      <div className="space-y-4">
        {/* Marca / Producto */}
        <label className="block text-sm font-medium mb-1">Seleccione Marca</label>
        <Dropdown
          options={marcas.map(m=>({value:m.id,label:m.label}))}
          value={form.marcaId}
          onChange={val=>setForm(f=>({...f,marcaId:val,productoId:''}))}
        />
        <label className="block text-sm font-medium mb-1">Seleccione Producto</label>
        <Dropdown
          options={productos.filter(p=>!form.marcaId||(p.marcasIds||[]).includes(form.marcaId))
                             .map(p=>({value:p.id,label:p.label}))}
          value={form.productoId}
          onChange={val=>setForm(f=>({...f,productoId:val}))}
          disabled={!form.marcaId}
        />

        {/* Lote */}
        <div>
          <label className="block text-sm font-medium mb-1">Lote (5 dígitos)</label>
          <input
            type="text"
            name="lote"
            value={form.lote}
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder="#####"
            onChange={e=>{
              const val=e.target.value.replace(/\D/g,'').slice(0,5);
              setForm(f=>({...f,lote:val}));
            }}
            className={`mt-1 block w-full rounded-xl border px-3 py-2 ${
              form.lote.length===5?'border-neutral-200':'border-red-500'
            } focus:border-brand focus:ring focus:ring-brand-light focus:ring-opacity-50`}
            required
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <input type="date" name="fechaFab" className="mt-1 block w-full rounded-xl border border-neutral-200 px-3 py-2" value={form.fechaFab} onChange={handleChange}/>
          <input type="date" name="fechaVto" className="mt-1 block w-full rounded-xl border border-neutral-200 px-3 py-2" value={form.fechaVto} onChange={handleChange}/>
        </div>

        {/* Báscula + peso */}
        <div className="flex gap-4 justify-center">
          <Button onClick={handleConnectScale}>Conectar Báscula</Button>
          <Button onClick={handleConnectBT}>Báscula BT</Button>
        </div>
        <div className="text-center text-3xl font-semibold tracking-wide">
          {form.peso} g
        </div>

        <Button onClick={handlePrint}>Imprimir</Button>
      </div>

      {/* UI extras */}
      <Toast  visible={toast.visible}  message={toast.message} />
      <Modal  open={printerMissing} title="Impresora no encontrada"
              message={`No se detectó BrowserPrint o una impresora Zebra.\n`+
                       `1. Instala Zebra Browser Print.\n2. Refresca la página.`}
              onClose={()=>setPrinterMissing(false)} />
      <ConfirmPrint open={confirmOpen} resumen={resumen}
                    onKeep={keepSame} onReset={resetAll} />
    </>
  );
};

export default LabelerForm;
