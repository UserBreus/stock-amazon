// Utilidad: genera un HTML estilizado del Panel de Control para imprimir o guardar como PDF.
// Sigue el mismo patrón seguro de ventana nueva y window.print() del WMS.

export interface ReporteDashboardData {
    kpis: { variantes: number; unidades: number };
    capital: { usd: number; uyu: number };
    mostConsumed: { nombre: string; cantidad: number } | null;
    topConsumo: any[];
    distAlmacenes: any[];
    distCategorias: any[];
    recomendacionesGlobales: any[];
    almacenesConQuiebres: any[];
    usuario: string;
}

export function printReporteDashboard(data: ReporteDashboardData): void {
    const fechaReporte = new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' });

    // Invertir el topConsumo si está al revés en la UI, para mostrar de #1 a #10
    const topOrdenado = [...data.topConsumo];
    // Si el último tiene más que el primero, es que está al revés (revertido para el gráfico de barras de Recharts)
    if (topOrdenado.length > 1 && topOrdenado[0].total_movimiento < topOrdenado[topOrdenado.length - 1].total_movimiento) {
        topOrdenado.reverse();
    }

    const rowsTopRotacion = topOrdenado.map((item, idx) => `
        <tr>
            <td style="text-align: center; font-weight: 900;">#${idx + 1}</td>
            <td style="font-weight: 700; color: #1e293b;">${item.nombre_variante}</td>
            <td style="text-align: center; font-weight: 800; color: #4f46e5;">${item.total_movimiento.toLocaleString()}</td>
        </tr>
    `).join('');

    const rowsAlmacenes = data.distAlmacenes.map(alm => `
        <tr>
            <td style="font-weight: 700; color: #1e293b;">${alm.nombre}</td>
            <td style="text-align: center; font-weight: 800;">${alm.valor.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 800; color: #16a34a;">USD ${Math.round(alm.capUSD).toLocaleString()}</td>
            <td style="text-align: right; font-weight: 800; color: #2563eb;">$U ${Math.round(alm.capUYU).toLocaleString()}</td>
        </tr>
    `).join('');

    const rowsFamilias = data.distCategorias.map(cat => `
        <tr>
            <td style="font-weight: 700; color: #1e293b;">${cat.nombre}</td>
            <td style="text-align: center; font-weight: 800; color: #4f46e5;">${cat.valor.toLocaleString()}</td>
        </tr>
    `).join('');

    const rowsAlertas = data.recomendacionesGlobales.map(item => `
        <tr>
            <td style="text-align: center; font-weight: 900; font-size: 7.5pt;">
                ${item.status === 'critico' 
                    ? '<span style="color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">CRÍTICO</span>' 
                    : '<span style="color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">ALERTA</span>'}
            </td>
            <td style="font-size: 7.5pt; color: #64748b; text-transform: uppercase;">${item.categoria || 'Sin Familia'}</td>
            <td style="font-weight: 700; font-size: 8pt; color: #1e293b;">${item.nombre_variante}</td>
            <td style="text-align: center; font-weight: 900; font-size: 9pt; color: #0f172a;">${item.stock_actual}</td>
            <td style="text-align: center; font-size: 7.5pt; font-weight: 700; color: #475569;">
                ${item.cantidad_critica > 0 ? `Crit: ${item.cantidad_critica}` : ''}
                ${item.cantidad_critica > 0 && item.cantidad_alerta > 0 ? ' / ' : ''}
                ${item.cantidad_alerta > 0 ? `Alert: ${item.cantidad_alerta}` : ''}
            </td>
        </tr>
    `).join('');

    const html = /* html */`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte Gerencial de Stock</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      position: relative;
      background: white;
    }
    .page:last-child { page-break-after: auto; }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }
    .header h1 { font-size: 20pt; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .header .subtitle { font-size: 8pt; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      min-width: 220px;
    }
    .meta-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 4px 0; }
    .meta-row:last-child { border-bottom: none; padding-bottom: 0; }
    .meta-label { font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-size: 6.5pt; }
    .meta-value { font-weight: 900; color: #334155; font-size: 8pt; }

    /* KPIs Grid */
    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
    }
    .kpi-title { font-size: 7pt; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .kpi-value { font-size: 14pt; font-weight: 900; color: #0f172a; }

    /* Section Grid */
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .full-width {
      grid-column: span 2;
    }

    h2.section-title {
      font-size: 11pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-left: 3px solid #6366f1;
      padding-left: 8px;
    }

    /* Tables */
    .table-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
    th {
      padding: 6px 8px;
      font-size: 7pt;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-right: 1px solid #e2e8f0;
      text-align: left;
    }
    th:last-child { border-right: none; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child { border-bottom: none; }
    td {
      padding: 6px 8px;
      font-size: 8pt;
      border-right: 1px solid #f1f5f9;
      line-height: 1.3;
    }
    td:last-child { border-right: none; }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      opacity: 0.5;
    }
    .footer p { font-size: 7pt; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; }

    /* Print rules */
    @page {
      size: A4 portrait;
      margin: 0;
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
  <!-- PAGINA 1: Resumen y Estadísticas de Rotación/Distribución -->
  <div class="page">
    <div class="header">
      <div>
        <h1>REPORTE GERENCIAL DE STOCK</h1>
        <p class="subtitle">Nexus WMS &middot; Inteligencia de Inventario</p>
      </div>
      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Generado Por</span>
          <span class="meta-value">${data.usuario}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Fecha Emisión</span>
          <span class="meta-value">${fechaReporte}</span>
        </div>
      </div>
    </div>

    <!-- Grid de KPIs -->
    <div class="kpis-grid">
      <div class="kpi-card">
        <div class="kpi-title">Capital Valorizado (USD)</div>
        <div class="kpi-value" style="color: #16a34a;">USD ${Math.round(data.capital.usd).toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Capital Valorizado (UYU)</div>
        <div class="kpi-value" style="color: #2563eb;">$U ${Math.round(data.capital.uyu).toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Volumen Total Stock</div>
        <div class="kpi-value">${data.kpis.unidades.toLocaleString()} uds</div>
      </div>
      <div class="kpi-card" style="grid-column: span 3; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="kpi-title">Artículo Más Consumido del Mes Actual</div>
          <div class="kpi-value" style="font-size: 11pt; font-weight: 800; max-width: 450px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${data.mostConsumed ? data.mostConsumed.nombre : 'Ninguno'}
          </div>
        </div>
        <div style="text-align: right;">
          <div class="kpi-title">Salidas</div>
          <div class="kpi-value" style="font-size: 13pt; color: #dc2626;">${data.mostConsumed ? data.mostConsumed.cantidad.toLocaleString() : '0'} uds</div>
        </div>
      </div>
    </div>

    <!-- Grid de Secciones -->
    <div class="section-grid">
      <!-- Top 10 Rotación -->
      <div style="grid-column: span 2;">
        <h2 class="section-title">Top 10 Rotación (Consumo del Mes Actual)</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Rank</th>
                <th>Nombre del Artículo</th>
                <th style="width: 100px; text-align: center;">Movimientos</th>
              </tr>
            </thead>
            <tbody>
              ${rowsTopRotacion || '<tr><td colspan="3" style="text-align:center;">Sin consumos registrados este mes</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Concentración por Almacén -->
      <div>
        <h2 class="section-title">Valorización por Almacén</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Almacén</th>
                <th style="width: 70px; text-align: center;">Unidades</th>
                <th style="width: 90px; text-align: right;">USD</th>
                <th style="width: 90px; text-align: right;">UYU</th>
              </tr>
            </thead>
            <tbody>
              ${rowsAlmacenes || '<tr><td colspan="4" style="text-align:center;">Sin stock disponible</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Concentración por Familia -->
      <div>
        <h2 class="section-title">Volumen por Familia (Top 8)</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Familia / Categoría</th>
                <th style="width: 100px; text-align: center;">Unidades</th>
              </tr>
            </thead>
            <tbody>
              ${rowsFamilias || '<tr><td colspan="2" style="text-align:center;">Sin stock categorizado</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Reporte de Gestión Gerencial &middot; Confidencial</p>
      <p>Página 1 de 2</p>
    </div>
  </div>

  <!-- PAGINA 2: Quiebres de Stock y Alertas -->
  <div class="page">
    <div class="header">
      <div>
        <h1>REPORTE DE RIESGOS Y QUIEBRES</h1>
        <p class="subtitle">Nexus WMS &middot; Alertas y Reposición</p>
      </div>
      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Total Alertas Globales</span>
          <span class="meta-value" style="color: #dc2626;">${data.recomendacionesGlobales.length} ítems</span>
        </div>
      </div>
    </div>

    <div>
      <h2 class="section-title">Ordenador Lógico de Compras (Stock Global en Alerta o Crítico)</h2>
      <p style="font-size: 8pt; font-weight: bold; color: #64748b; margin-bottom: 10px;">
        Los siguientes artículos han cruzado los niveles mínimos globales configurados en el sistema y requieren reposición inmediata.
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width: 90px; text-align: center;">Estado</th>
              <th style="width: 100px;">Familia</th>
              <th>Artículo Físico</th>
              <th style="width: 90px; text-align: center;">Stock Global</th>
              <th style="width: 110px; text-align: center;">Límites (C / A)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsAlertas || '<tr><td colspan="5" style="text-align:center; padding: 20px; font-weight: bold; color: #16a34a;">✔ No se registran quiebres de stock. ¡Inventario 100% sano!</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer" style="margin-top: auto;">
      <p>Reporte de Gestión Gerencial &middot; Confidencial</p>
      <p>Página 2 de 2</p>
    </div>
  </div>

  <script>
    function doPrint() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }
    setTimeout(doPrint, 150);
  </script>
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
