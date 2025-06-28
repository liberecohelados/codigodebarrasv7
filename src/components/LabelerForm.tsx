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
import Button   from './ui/Button';
import Dropdown from './ui/Dropdown';
import Toast    from './ui/Toast';
import Modal    from './ui/Modal';
import PrinterStatus from './ui/PrinterStatus';
import ScaleStatus   from './ui/ScaleStatus';

interface Product { /* …igual… */ }
interface Marca   { /* …igual… */ }

const LabelerForm: React.FC = () => {
  /* ---------- state ---------- */
  const [productos, setProductos] = useState<Product[]>([]);
  const [marcas,    setMarcas]    = useState<Marca[]>([]);
  const [contador,  setContador]  = useState<{ id:string; nextId:number }|null>(null);

  const [form, setForm] = useState({
    productoId: '', marcaId:'', lote:'', fechaFab:'', fechaVto:'', peso:0,
  });

  const [toast,          setToast]          = useState({ visible:false, message:'' });
  const [printerOk,      setPrinterOk]      = useState(false);
  const [scaleOk,        setScaleOk]        = useState(false);
  const [printerMissing, setPrinterMissing] = useState(false);

  /* ---------- carga inicial ---------- */
  useEffect(() => {
    (async () => {
      setContador(await getContador());
      setProductos(await getProductos());
      setMarcas   (await getMarcas());

      const hoy = new Date();
      const vto = new Date(); vto.setFullYear(vto.getFullYear()+2);
      setForm(f => ({ ...f,
        fechaFab: hoy.toISOString().slice(0,10),
        fechaVto: vto.toISOString().slice(0,10),
      }));
    })();
  }, []);

  /* ---------- handlers ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.name==='peso' ? +e.target.value : e.target.value }));

  const handleConnectScale = async () => {
    try{
      if (!('serial' in navigator)) throw new Error('WebSerial no soportado');
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate:9600 });
      const rdr = port.readable.pipeThrough(new TextDecoderStream()).getReader();
      setScaleOk(true);
      while (true) {
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

  const handlePrint = async () => {
    if (!contador) return;
    const prod = productos.find(p=>p.id===form.productoId);
    const mkt  = marcas   .find(m=>m.id===form.marcaId);
    if (!prod||!mkt) return alert('Seleccione producto y marca');

    const idLata   = contador.nextId;
    const codigo21 = buildCodigo21({ idLata, lote:form.lote, indicador:mkt.indicador,
                                     codigoProducto:prod.codigo, pesoGramos:form.peso });

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
      id_lata:idLata, lote:+form.lote, marcaLabel:mkt.label, productoLabel:prod.label,
      peso:form.peso, rne:prod.rne, rnpa:prod.rnpa, codigo21,
      fechaFab:form.fechaFab, fechaVto:form.fechaVto,
    });

    await patchContador(contador.id, idLata+1);
    setContador({ id:contador.id, nextId:idLata+1 });

    /* ---------- imprimir ---------- */
    if ((window as any).BrowserPrint){
      (window as any).BrowserPrint.getDefaultDevice('printer',(p:any)=>{
        if (p){ setPrinterOk(true); p.send(zpl); }
        else  { setPrinterOk(false); setPrinterMissing(true); }
      });
    }else{ setPrinterOk(false); setPrinterMissing(true); }

    setToast({visible:true, message:'Etiqueta impresa y guardada!'});
    setTimeout(()=>setToast({visible:false,message:''}),3000);

    if (!window.confirm(
      `Impresión OK.\n\n¿Seguir con ${prod.label} / ${mkt.label} (mismo lote ${form.lote})?`
    )){
      window.location.reload();
    }else{
      setForm(f=>({...f,peso:0}));
    }
  };

  /* ---------- render ---------- */
  return (
    <>
      {/* Indicadores de estado */}
      <PrinterStatus online={printerOk} onRetry={()=>window.location.reload()} />
      <ScaleStatus   online={scaleOk  } onRetry={handleConnectScale} />

      <div className="space-y-4">
        {/* Marca & Producto */}
        {/* …sin cambios… */}

        {/* Acciones */}
        <div className="flex gap-4 justify-center">
          <Button onClick={handleConnectScale}>Conectar Báscula</Button>
          <Button onClick={handleConnectBT}>Báscula BT</Button>
        </div>

        {/* Peso grande debajo */}
        <div className="text-center text-3xl font-semibold tracking-wide">
          {form.peso} g
        </div>

        <Button onClick={handlePrint}>Imprimir</Button>
      </div>

      <Toast visible={toast.visible} message={toast.message} />
      <Modal /* impresora faltante */ … />
    </>
  );
};

export default LabelerForm;
