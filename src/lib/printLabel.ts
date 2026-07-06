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

export interface PrintConfig {
  size: '10x15' | '4x4' | 'custom' | 'grid';
  customWidth?: number;
  customHeight?: number;
}

// Imprime una única etiqueta
export const printLabel = async (item: LabelItem, config?: PrintConfig) => {
  await printLabels([item], config);
};

// Imprime múltiples etiquetas en una sola ventana
export const printLabels = async (items: LabelItem[], config: PrintConfig = { size: 'grid' }) => {
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
        <div class="item-id-barcode">${item.id}</div>
        ${item.sku ? `<div class="sku-code">SKU: ${item.sku}</div>` : ''}
      </div>
    `;
    }).join('');

    const isGrid = config.size === 'grid';
    const cw = config.size === '10x15' ? 100 : config.size === '4x4' ? 40 : (config.customWidth || 100);
    const ch = config.size === '10x15' ? 150 : config.size === '4x4' ? 40 : (config.customHeight || 150);
    
    // Si no es grid, la página se define por la etiqueta y forzamos quiebre por cada una.
    const pageCss = isGrid 
      ? `@page { margin: 5mm; }` 
      : `@page { size: ${cw}mm ${ch}mm; margin: 0; }
         html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }`;

    const baseFontSize = isGrid 
      ? '10px' 
      : config.size === '4x4' 
        ? '8pt' 
        : config.size === '10x15' 
          ? '14pt' 
          : `${Math.max(8, Math.min(18, ch * 0.1))}pt`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Etiquetas de Inventario</title>
          <style>
            ${pageCss}
            * { box-sizing: border-box; }
            body {
              ${isGrid ? "margin: 0; padding: 4px;" : ""}
              font-family: 'Arial', sans-serif;
              background: #fff;
              color: #000;
            }
            .labels-container {
              ${isGrid ? "display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;" : "display: block; width: 100%; height: 100%;"}
            }
            .label-card {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: ${baseFontSize};
              ${isGrid 
                ? "padding: 6px 4px; border: 1px dashed #bbb; border-radius: 6px; page-break-inside: avoid; position: relative;" 
                : "width: 100%; height: 100%; page-break-after: always; page-break-inside: avoid; padding: 10px; overflow: hidden; position: relative;"
              }
            }
            .label-card.lote-individual { border: ${isGrid ? "2px solid #f59e0b" : "none"}; }
            .label-card.granel { border: ${isGrid ? "1px solid #3b82f6" : "none"}; }
            
            .tipo-badge {
              font-size: 0.7em;
              font-weight: 900;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              padding: 1px 4px;
              border-radius: 3px;
              margin-bottom: 0.5em;
            }
            .lote-individual .tipo-badge { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
            .granel .tipo-badge { background: #eff6ff; color: #1e40af; border: 1px solid #3b82f6; }
            
            .qr-image {
              height: ${isGrid ? '80px' : '35%'};
              max-height: ${isGrid ? '80px' : '35%'};
              max-width: 100%;
              object-fit: contain;
              image-rendering: pixelated;
              display: block;
              margin: 0 auto;
              flex-shrink: 1;
            }
            
            .product-name {
              font-size: 1.4em;
              padding: 0 2vw;
              font-weight: 900;
              margin-top: 0.5em;
              line-height: 1.1;
              text-transform: uppercase;
              word-break: break-word;
            }
            .variant-name {
              font-size: 1.1em;
              font-weight: 600;
              color: #444;
              margin-top: 0.2em;
            }
            .item-id-barcode { 
                font-size: 0.6em; 
                font-weight: 900; 
                font-family: 'Courier New', monospace; 
                background: #eee; 
                padding: 0.4em 0.8em;
                border-radius: 4px;
                letter-spacing: 1px;
                margin-top: 0.8em;
                margin-bottom: 0.5em;
                max-width: 90vw;
                overflow: hidden;
            }
            .sku-code {
              font-size: 0.8em;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${labelsHtml}
          </div>
          <script>
            function initPrint() {
              document.querySelectorAll('.label-card').forEach(card => {
                 let f = 100;
                 let imgH = 35;
                 if (card.clientHeight > 0) {
                     while (card.scrollHeight > card.clientHeight && f > 40) {
                        f -= 5;
                        imgH -= 1.5;
                        card.style.fontSize = f + '%';
                        const img = card.querySelector('.qr-image');
                        if (img) img.style.height = imgH + '%';
                     }
                 }
              });
              
              setTimeout(() => {
                  window.print();
                  setTimeout(() => { window.close(); }, 500);
              }, 150);
            }
            
            setTimeout(initPrint, 150);
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
