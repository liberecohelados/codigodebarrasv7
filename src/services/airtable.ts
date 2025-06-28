import Airtable from 'airtable';

Airtable.configure({ apiKey: import.meta.env.VITE_AIRTABLE_KEY as string });
const base = Airtable.base(import.meta.env.VITE_AIRTABLE_BASE as string);

/* ---------- CONTADOR ---------- */
export async function getContador() {
  const rec = (
    await base('contadores')
      .select({ maxRecords: 1, fields: ['next_id_lata'] })
      .firstPage()
  )[0];

  return { id: rec.id, nextId: rec.fields.next_id_lata as number };
}

/* ---------- PRODUCTOS + MARCAS ---------- */
export async function getProductos() {
  const recs = await base('productos')
    .select({
      fields: [
        'nombre producto',
        'codigo_producto',
        'rne',
        'rnpa',
        'ingredientes',
        'Link a Marcas',
      ],
    })
    .all();

  return recs.map(r => ({
    id         : r.id,
    label      : r.fields['nombre producto'] as string,
    codigo     : String(r.fields.codigo_producto).padStart(3, '0'),
    ingredientes: (r.fields.ingredientes || '') as string,
    marcasIds  : (r.fields['Link a Marcas'] || []) as string[],
    rne        : r.fields.rne as string,
    rnpa       : r.fields.rnpa as string,
  }));
}

export async function getMarcas() {
  const recs = await base('marcas')
    .select({ fields: ['nombre', 'indicador'] })
    .all();

  return recs.map(r => ({
    id        : r.id,
    label     : r.fields.nombre as string,
    indicador : r.fields.indicador as number,
  }));
}

/* ---------- IMPRESIONES ---------- */
export async function postImpresion(data: {
  id_lata   : number;
  lote      : number;
  marca     : string;
  producto  : string;
  peso_g    : number;
  rne       : string;
  rnpa      : string;
  codigo21  : string;
  fecha_fab : string;
  fecha_vto : string;
}) {
  await base('impresiones').create([{ fields: data }]);
}

/* ---------- PATCH CONTADOR ---------- */
export async function patchContador(id: string, nextId: number) {
  await base('contadores').update([{ id, fields: { next_id_lata: nextId } }]);
}
