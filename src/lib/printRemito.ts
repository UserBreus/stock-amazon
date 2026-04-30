// Utilidad: genera HTML plano de un remito y lo imprime en ventana nueva
// Regla permanente: NUNCA usar window.print() directo en una SPA — siempre usar ventana nueva
// Ver walkthrough.md para detalles completos del mecanismo

export function printRemitoHTML(pages: string[]): void {
  const html = /* html */`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Remito WMS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
      color: #1e293b;
      /* Sin márgenes propios — cada .page los gestiona */
      margin: 0;
      padding: 0;
    }

    /*
     * REGLA CRÍTICA DE A4:
     * - width:  210mm (A4 portrait)
     * - height: 297mm — FIJO, NO min-height
     * - overflow: hidden — NUNCA desborda; el chunk de items garantiza que caben
     * - page-break-after: always — cada .page = 1 hoja de impresora
     * Los márgenes internos (padding) deben ser conservadores: 12mm arriba/abajo, 15mm lados
     */
    .page {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      padding: 12mm 15mm 10mm 15mm;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      position: relative;
      background: white;
    }
    .page:last-child { page-break-after: auto; }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    .header h1 { font-size: 18pt; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; line-height: 1; }
    .header .subtitle { font-size: 6.5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-top: 3px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; min-width: 175px; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 3px 0; }
    .meta-row:last-child { border-bottom: none; padding-bottom: 0; }
    .meta-label { font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-size: 6pt; }
    .meta-value { font-weight: 900; color: #334155; font-family: monospace; font-size: 7.5pt; }
    .meta-value.badge { background: #dcfce7; color: #166534; padding: 1px 5px; border-radius: 3px; font-size: 6.5pt; }

    /* ── Locations ── */
    .locations {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    .location-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; }
    .location-label { font-size: 6.5pt; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
    .location-name { font-weight: 900; font-size: 11pt; color: #1e293b; line-height: 1.2; }

    /* ── Table — ocupa el espacio disponible restante ── */
    .table-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      flex: 1;               /* ocupa todo el espacio entre locations y signatures */
      min-height: 0;         /* necesario para que flex:1 no desborde */
      display: flex;
      flex-direction: column;
    }
    table { width: 100%; border-collapse: collapse; }
    thead { position: sticky; top: 0; }
    thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
    th {
      padding: 4px 6px;
      font-size: 6.5pt;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-right: 1px solid #e2e8f0;
      text-align: center;
    }
    th:last-child { border-right: none; }
    th.left { text-align: left; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody tr:last-child { border-bottom: none; }
    td {
      padding: 3.5px 6px;
      font-size: 8.5pt;
      border-right: 1px solid #f1f5f9;
      line-height: 1.3;
    }
    td:last-child { border-right: none; }
    td.qty  { font-weight: 900; color: #1e293b; text-align: center; }
    td.qty-rec { font-weight: 900; color: #16a34a; text-align: center; }
    td.name { font-weight: 600; color: #1e293b; }
    td.var  { font-size: 7.5pt; text-transform: uppercase; color: #64748b; font-weight: 700; text-align: center; }

    /* ── Signatures ── */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 8px;
      padding: 0 6px;
      flex-shrink: 0;
    }
    .sig-line { border-top: 1.5px dashed #cbd5e1; padding-top: 4px; text-align: center; }
    .sig-title { font-weight: 900; font-size: 7pt; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; }
    .sig-sub { font-size: 6pt; color: #94a3b8; font-weight: 700; letter-spacing: 1px; margin-top: 1px; }

    /* ── Footer ── */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 5px;
      padding: 0 6px;
      opacity: 0.35;
      flex-shrink: 0;
    }
    .footer p { font-size: 6pt; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; }

    /* ── Print rules ── */
    @page {
      size: A4 portrait;
      margin: 0;           /* el .page gestiona sus propios márgenes internos */
    }
    @media print {
      html, body { width: 210mm; margin: 0; padding: 0; background: white; }
      .page {
        width: 210mm;
        height: 297mm;
        overflow: hidden;
      }
    }
  </style>
</head>
<body>
  ${pages.join('\n')}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('El navegador bloqueó la ventana emergente. Permitir pop-ups para este sitio y volver a intentar.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

/**
 * Construye el HTML de UNA página A4 de remito.
 *
 * Matemática de A4 con los estilos actuales:
 *   Altura total de página:  297mm
 *   Padding top+bottom:       22mm  (12mm + 10mm)
 *   Área de contenido:       275mm
 *
 *   Header (title + meta):    ~22mm
 *   Locations (2 cajas):      ~18mm
 *   Table header row:          ~7mm
 *   Cada fila de tabla:        ~5.5mm  (3.5px pad * 2 + 11pt línea)
 *   Signatures:               ~10mm
 *   Footer:                    ~5mm
 *   Espaciados internos:       ~8mm
 *   ─────────────────────────────
 *   Overhead fijo:            ~70mm
 *   Disponible para filas:    205mm
 *   Filas máximas seguros:    205mm / 5.5mm ≈ 37 filas
 *
 * Usamos 30 filas por defecto para dejar margen y que los bordes no se corten.
 */
export function buildRemitoPage(
  items: any[],
  meta: { codigo: string; fecha: string; estado: string; origen: string; destino: string },
  pageIndex: number,
  totalPages: number,
  mode: 'despacho' | 'recepcion' = 'despacho'
): string {
  const rows = items.map(c => {
    const qty    = c.cantidad_a_extraer ?? c.cantidad_enviada ?? '';
    const qtyRec = mode === 'recepcion' ? (c.cantidad_recibida ?? '-') : '-';
    const name   = c.producto_nombre ?? c.name ?? '';
    const variant = c.nombre_variante ?? c.variante ?? '';
    return `
      <tr>
        <td class="qty">${qty}</td>
        <td class="qty-rec">${qtyRec}</td>
        <td class="name">${name}</td>
        <td class="var">${variant}</td>
      </tr>`;
  }).join('');

  return `
<div class="page">
  <div class="header">
    <div>
      <h1>REMITO DE MOVIMIENTO</h1>
      <p class="subtitle">Sistema Log&iacute;stico Interno &middot; WMS</p>
    </div>
    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">N&deg; Documento</span>
        <span class="meta-value">${meta.codigo}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Fecha Operaci&oacute;n</span>
        <span class="meta-value">${meta.fecha}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Estado</span>
        <span class="meta-value badge">${meta.estado}</span>
      </div>
    </div>
  </div>

  <div class="locations">
    <div class="location-box">
      <div class="location-label">&#8599; Sale desde (Origen)</div>
      <div class="location-name">${meta.origen}</div>
    </div>
    <div class="location-box">
      <div class="location-label">${meta.estado === 'EGRESO' ? 'Tipo de Operación' : '&#8644; Llega a (Destino F&iacute;sico)'}</div>
      <div class="location-name">${meta.estado === 'EGRESO' ? 'Retiro Libre (Egreso)' : meta.destino}</div>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:55px">C. ENV</th>
          <th style="width:55px">C. REC</th>
          <th class="left">ART&Iacute;CULO / DESCRIPCI&Oacute;N</th>
          <th style="width:110px">VAR / LOTE</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>

  <div class="signatures">
    <div class="sig-line">
      <p class="sig-title">Firma de Entrega (Origen)</p>
      <p class="sig-sub">ACLARACI&Oacute;N Y DNI</p>
    </div>
    <div class="sig-line">
      <p class="sig-title">Firma de Recepci&oacute;n (Destino)</p>
      <p class="sig-sub">ACLARACI&Oacute;N Y FECHA</p>
    </div>
  </div>

  <div class="footer">
    <p>&#10003; WMS &middot; DOC. DIGITAL</p>
    <p>HOJA ${pageIndex + 1} DE ${totalPages}</p>
  </div>
</div>`;
}

/** Divide un array en chunks de `size` elementos */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result.length ? result : [[]];
}

/**
 * Punto de entrada principal.
 * itemsPerPage = 30 — calculado para caber exactamente en A4 con los estilos actuales.
 * Ver comentario en buildRemitoPage para la matemática.
 */
export function printRemito(
  items: any[],
  meta: { codigo: string; fecha: string; estado: string; origen: string; destino: string },
  mode: 'despacho' | 'recepcion' = 'despacho',
  itemsPerPage = 30
): void {
  const pages = chunkArray(items, itemsPerPage);
  const htmlPages = pages.map((chunk, idx) =>
    buildRemitoPage(chunk, meta, idx, pages.length, mode)
  );
  printRemitoHTML(htmlPages);
}
