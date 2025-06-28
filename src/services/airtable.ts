import Airtable from 'airtable';

Airtable.configure({
  apiKey: import.meta.env.VITE_AIRTABLE_KEY as string,
});

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

/* ---------- PRODUCTOS (nombre, ingredientes, lookup marcas) ---------- */
export async function getProductos() {
  const recs = await base('productos')
    .select({
      fields: [
        'nombre producto',   // nombre que ves en Airtable
        'codigo_producto',
        'rne',
        'rnpa',
        'ingredientes',
        'Link a Marcas',     // lookup múltiple
      ],
    })
    .all();                 // <-- UNA sola llamada .all()

  return recs.map(r => ({
    id: r.id,
    label: r.fields['nombre producto'] as string,
    codigo: String(r.fields.codigo_producto).padStart(3, '0'),
    ingredientes: (r.fields.ingredientes || '') as string,
    marcasIds: (r.fields['Link a Marcas'] || []) || []) as string[],
    rne: r.fields.rne as string,
    rnpa: r.fields.rnpa as string,
  }));
}

/* ---------- MARCAS ---------- */
export async function getMarcas() {
  const recs = await base('marcas')
    .select({ fields: ['nombre', 'indicador'] })
    .all();
  return recs.map(r => ({
    id: r.id,
    label: r.fields.nombre as string,
    indicador: r.fields.indicador as number,
  }));
}

/* ---------- IMPRESIONES ---------- */
export async function postImpresion(data: any) {
  await base('impresiones').create([
    {
      fields: {
        id_lata: data.id_lata,
        lote: data.lote,
        marca: [data.marcaId],
        producto: [data.productoId],
        peso_g: data.peso,
        rne: data.rne,
        rnpa: data.rnpa,
        codigo21: data.codigo21,
      },
    },
  ]);
}

/* ---------- PATCH CONTADOR ---------- */
export async function patchContador(id: string, nextId: number) {
  await base('contadores').update([{ id, fields: { next_id_lata: nextId } }]);
}

/* ---------- LOTE DUPLICADO ---------- */
export async function loteYaExiste(lote: number): Promise<boolean> {
  const recs = await base('impresiones')
    .select({
      maxRecords: 1,
      fields: ['lote'],
      filterByFormula: `{lote} = ${lote}`,
    })
    .firstPage();
  return recs.length > 0;
}
