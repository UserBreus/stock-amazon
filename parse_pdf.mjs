import fs from 'fs';
import PDFParser from 'pdf2json';

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync("pdf_data.json", JSON.stringify(pdfData));
    console.log("JSON generated.");
});

pdfParser.loadPDF("INVENTARIO USER - STOCK Marzo 2026.pdf");
