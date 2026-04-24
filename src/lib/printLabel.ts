import QRCode from 'qrcode';

export const printLabel = async (item: {
  id: string | number;
  producto_padre: string;
  nombre_variante?: string;
  sku?: string;
}) => {
  try {
    // Generate QR Code data URL using the absolute ID
    const qrDataUrl = await QRCode.toDataURL(String(item.id), {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes (pop-ups) para imprimir etiquetas.");
      return;
    }

    // HTML Structure using a thermal-friendly flex layout (approx 50x50mm scaling)
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta - ${item.id}</title>
          <style>
            @page {
              margin: 0;
              /* Optional: define page size if you have a specific roll standard */
              /* size: 50mm 50mm; */
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: sans-serif; 
              background: #fff;
              color: #000;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
            }
            .label-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 0.2rem;
              max-width: 95%;
              max-height: 95%;
            }
            .qr-image {
              max-width: 150px;
              max-height: 150px;
              width: 100%;
              height: auto;
              image-rendering: pixelated;
              display: block;
              margin: 0 auto;
            }
            .product-name {
              font-size: 14px;
              font-weight: 900;
              margin-top: 4px;
              line-height: 1.1;
              text-transform: uppercase;
              word-break: break-word;
            }
            .variant-name {
              font-size: 11px;
              font-weight: 600;
              color: #333;
              margin-top: 2px;
            }
            .item-id {
              font-size: 10px;
              font-weight: bold;
              margin-top: 4px;
              background-color: #000;
              color: #fff;
              padding: 2px 6px;
              border-radius: 4px;
            }
            .sku-code {
               font-size: 9px;
               margin-top: 2px;
               color: #555;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <img src="${qrDataUrl}" alt="QR Code" class="qr-image" />
            <div class="product-name">${item.producto_padre}</div>
            ${item.nombre_variante ? `<div class="variant-name">${item.nombre_variante}</div>` : ''}
            <div class="item-id">ID: ${item.id}</div>
            ${item.sku ? `<div class="sku-code">SKU: ${item.sku}</div>` : ''}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 300);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  } catch (error) {
    console.error("Error generating QR label:", error);
    alert("Ocurrió un error al generar la etiqueta QR.");
  }
};
