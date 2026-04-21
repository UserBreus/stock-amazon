const fs = require('fs');
const pdfParseObj = require('pdf-parse');
console.log(pdfParseObj);

const pdfParse = typeof pdfParseObj === 'function' ? pdfParseObj : pdfParseObj.default || Object.values(pdfParseObj)[0];

let dataBuffer = fs.readFileSync('INVENTARIO USER - STOCK Marzo 2026.pdf');

pdfParse(dataBuffer).then(function(data) {
    fs.writeFileSync('INVENTARIO_USER_STOCK_Marzo_2026.txt', data.text);
    console.log("PDF Parsed successfully.");
}).catch(console.error);
