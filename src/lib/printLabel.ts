import QRCode from 'qrcode';

export interface LabelItem {
  /** Para granel: el variante_id. Para lote_individual: el id de Stock_Etiquetas */
  id: string | number;
  producto_padre: string;
  nombre_variante?: string;
  sku?: string;
  /** 'granel' (default) o 'lote_individual' */
  tipo_gestion?: 'granel' | 'lote_individual';
  /** Solo para granel: cantidad en el lote */
  cantidad?: number;
}

// Imprime una única etiqueta
export const printLabel = async (item: LabelItem) => {
  await printLabels([item]);
};

// Imprime múltiples etiquetas en una sola ventana
export const printLabels = async (items: LabelItem[]) => {
  if (items.length === 0) return;

  try {
    // Cada etiqueta lleva el QR correcto según su tipo
    // - granel       → QR encodes variante_id  (identifica el tipo de producto)
    // - lote_individual → QR encodes etiqueta.id (identifica la pieza física única)
    const qrDataUrls = await Promise.all(
      items.map(item =>
        QRCode.toDataURL(String(item.id), {
          width: 200,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        })
      )
    );

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes (pop-ups) para imprimir etiquetas.');
      return;
    }

    const labelsHtml = items.map((item, i) => {
      const esLoteInd = item.tipo_gestion === 'lote_individual';
      return `
      <div class="label-card ${esLoteInd ? 'lote-individual' : 'granel'}">
        <div class="tipo-badge">${esLoteInd ? 'PIEZA ÚNICA' : 'LOTE'}</div>
        <img src="${qrDataUrls[i]}" alt="QR" class="qr-image" />
        <div class="product-name">${item.producto_padre}</div>
        ${item.nombre_variante ? `<div class="variant-name">${item.nombre_variante}</div>` : ''}
        <div class="item-id">${esLoteInd ? `ETQ: ${item.id}` : `VAR: ${item.id}`}</div>
        ${item.sku ? `<div class="sku-code">SKU: ${item.sku}</div>` : ''}
        ${!esLoteInd && item.cantidad ? `<div class="qty-badge">QTY: ${item.cantidad}</div>` : ''}
      </div>
    `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Etiquetas de Inventario</title>
          <style>
            @page { margin: 5mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 4px;
              font-family: 'Arial', sans-serif;
              background: #fff;
              color: #000;
            }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 4px;
            }
            .label-card {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 6px 4px;
              border: 1px dashed #bbb;
              border-radius: 6px;
              page-break-inside: avoid;
              position: relative;
            }
            .label-card.lote-individual {
              border-color: #f59e0b;
              border-width: 2px;
            }
            .label-card.granel {
              border-color: #3b82f6;
            }
            .tipo-badge {
              font-size: 7px;
              font-weight: 900;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              padding: 1px 4px;
              border-radius: 3px;
              margin-bottom: 3px;
            }
            .lote-individual .tipo-badge {
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #f59e0b;
            }
            .granel .tipo-badge {
              background: #eff6ff;
              color: #1e40af;
              border: 1px solid #3b82f6;
            }
            .qr-image {
              width: 100px;
              height: 100px;
              image-rendering: pixelated;
              display: block;
              margin: 0 auto;
            }
            .product-name {
              font-size: 10px;
              font-weight: 900;
              margin-top: 4px;
              line-height: 1.2;
              text-transform: uppercase;
              word-break: break-word;
            }
            .variant-name {
              font-size: 9px;
              font-weight: 600;
              color: #444;
              margin-top: 1px;
            }
            .item-id {
              font-size: 9px;
              font-weight: bold;
              margin-top: 3px;
              background-color: #000;
              color: #fff;
              padding: 1px 5px;
              border-radius: 3px;
            }
            .sku-code {
              font-size: 8px;
              margin-top: 2px;
              color: #555;
            }
            .qty-badge {
              font-size: 8px;
              font-weight: bold;
              margin-top: 2px;
              background: #dcfce7;
              color: #166534;
              padding: 1px 4px;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <div class="labels-grid">
            ${labelsHtml}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 400);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  } catch (error) {
    console.error('Error generating QR labels:', error);
    alert('Ocurrió un error al generar las etiquetas QR.');
  }
};
