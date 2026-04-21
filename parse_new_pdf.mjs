import fs from 'fs';
import PDFParser from 'pdf2json';

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync("pdf_data_new.json", JSON.stringify(pdfData));
    console.log("JSON generated.");
});

const path = 'C:/Users/user2/Documents/tincho/web_stock/INVENTARIO USER - STOCK Marzo 2026 (1).pdf';
if (fs.existsSync(path)) {
    pdfParser.loadPDF(path);
} else {
    // maybe .pdf extension is not there, check directory contents
    console.log("File not found at: " + path);
}
