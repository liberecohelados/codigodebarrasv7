import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getContador,
  getProductos,
  getMarcas,
  postImpresion,
  patchContador,
  loteYaExiste, // ← import
} from '../services/airtable';
import { buildCodigo21 } from '../utils/formatters';
import Button from './ui/Button';
import Dropdown from './ui/Dropdown';
import Toast from './ui/Toast';

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
  const [productos, setProductos] = useState<Product[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [contador, setContador] =
    useState<{ id: string; nextId: number } | null>(null);

  const [form, setForm] = useState({
    productoId: '',
    marcaId: '',
    lote: '',
    fechaFab: '',
    fechaVto: '',
    peso: 0,
  });

  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  /* ---------- Carga inicial ---------- */
  useEffect(() => {
    (async () => {
      const cnt = await getContador();
      setContador(cnt);
      setProductos(await getProductos());
      setMarcas(await getMarcas());

      const hoy = new Date().toISOString().slice(0, 10);
      const vto = new Date();
      vto.setFullYear(vto.getFullYear() + 2);
      setForm(f => ({ ...f, fechaFab: hoy, fechaVto: vto.toISOString().slice(0, 10) }));
    })();
  }, []);

  /* ---------- Handlers ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'peso' ? Number(value) : value }));
  };

  const handleConnectScale = async () => {
    if (!('serial' in navigator)) return alert('WebSerial no soportado');
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    const rdr = port.readable.pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { value, done } = await rdr.read();
      if (done) break;
      const m = /([\d.]+)/.exec(value);
      if (m) setForm(f => ({ ...f, peso: Math.round(parseFloat(m[1]) * 1000) }));
    }
  };

  const handleConnectBT = async () => {
    if (!('bluetooth' in navigator)) return alert('Bluetooth no soportado');
    try {
      await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
      alert('Conectado a báscula BT (demo)');
    } catch (e) {
      console.error(e);
      alert('Error Bluetooth');
    }
  };

  const handlePrint = async () => {
    /* --- Validar lote único --- */
    const loteNum = Number(form.lote);
    if (await loteYaExiste(loteNum)) {
      alert(`El lote ${loteNum} ya existe.`);
      return;
    }

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

    /* ZPL 60×100 mm */
    const zpl = [
      '^XA^CI28',
      '^PW800',
      '^LL480',
      `^FO20,20^A0N,36,36^FD${prod.label.toUpperCase()}^FS`,
      '^FO20,60^GB760,30,30^FS',
      `^FO40,65^A0N,26,26^FD${mkt.label}^FS`,
      `^FO20,110^A0N,18,18^FD${prod.ingredientes.replace(/\\./g, '').slice(0, 112)}^FS`,
      `^FO20,160^A0N,18,18^FDRNE ${prod.rne}  RNPA ${prod.rnpa}^FS`,
      `^FO20,190^A0N,18,18^FDF. ELAB: ${form.fechaFab}^FS`,
      `^FO400,190^A0N,18,18^FDF. VTO: ${form.fechaVto}^FS`,
      `^FO20,220^A0N,18,18^FDLOTE: ${form.lote}^FS`,
      `^FO20,250^BY2^BCN,80,Y,N,N^FD${codigo21}^FS`,
      '^XZ',
    ].join('\\n');

    /* Guardar en Airtable */
    await postImpresion({
      id_lata: idLata,
      lote: loteNum,
      marcaId: form.marcaId,
      productoId: form.productoId,
      peso: form.peso,
      rne: prod.rne,
      rnpa: prod.rnpa,
      codigo21,
    });

    /* Incrementar contador */
    await patchContador(contador.id, idLata + 1);
    setContador({ id: contador.id, nextId: idLata + 1 });

    /* Imprimir */
    (window as any).BrowserPrint.getDefaultDevice('printer', (p: any) => p.send(zpl));

    setToast({ visible: true, message: 'Etiqueta impresa con éxito!' });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);

    if (!window.confirm('¿Mismo artículo?')) window.location.reload();
    else setForm(f => ({ ...f, peso: 0 }));
  };

  /* ---------- Render ---------- */
  return (
    <>
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
            .filter(p => !form.marcaId || (p.marcasIds || []).includes(form.marcaId))
            .map(p => ({ value: p.id, label: p.label }))}
          value={form.productoId}
          onChange={val => setForm(f => ({ ...f, productoId: val }))}
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
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
              setForm(f => ({ ...f, lote: val }));
            }}
            className={`mt-1 block w-full rounded-xl border px-3 py-2 ${
              form.lote.length === 5 ? 'border-neutral-200' : 'border-red-500'
            } focus:border-brand focus:ring focus:ring-brand-light focus:ring-opacity-50`}
            required
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="fechaFab"
            className="mt-1 block w-full rounded-xl border border-neutral-200 px-3 py-2"
            value={form.fechaFab}
            onChange={handleChange}
          />
          <input
            type="date"
            name="fechaVto"
            className="mt-1 block w-full rounded-xl border border-neutral-200 px-3 py-2"
            value={form.fechaVto}
            onChange={handleChange}
          />
        </div>

        {/* Báscula */}
        <div>
          <Button onClick={handleConnectScale}>Conectar Báscula</Button>
          <Button onClick={handleConnectBT} className="ml-2">
            Báscula BT
          </Button>
          <motion.span
            key={form.peso}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="ml-4 font-semibold text-lg"
          >
            {form.peso} g
          </motion.span>
        </div>

        <Button onClick={handlePrint}>Imprimir</Button>
      </div>

      <Toast visible={toast.visible} message={toast.message} />
    </>
  );
};

export default LabelerForm;
