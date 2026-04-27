import QRCode from 'qrcode';

export interface LabelItem {
  id: string | number;
  producto_padre: string;
  nombre_variante?: string;
  sku?: string;
}

// Imprime una única etiqueta
export const printLabel = async (item: LabelItem) => {
  await printLabels([item]);
};

// Imprime múltiples etiquetas en una sola ventana (una por hoja o en grilla)
export const printLabels = async (items: LabelItem[]) => {
  try {
    // Generate all QR codes in parallel
    const qrDataUrls = await Promise.all(
      items.map(item =>
        QRCode.toDataURL(String(item.id), {
          width: 180,
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

    const labelsHtml = items.map((item, i) => `
      <div class="label-card">
        <img src="${qrDataUrls[i]}" alt="QR" class="qr-image" />
        <div class="product-name">${item.producto_padre}</div>
        ${item.nombre_variante ? `<div class="variant-name">${item.nombre_variante}</div>` : ''}
        <div class="item-id">ID: ${item.id}</div>
        ${item.sku ? `<div class="sku-code">SKU: ${item.sku}</div>` : ''}
      </div>
    `).join('');

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
