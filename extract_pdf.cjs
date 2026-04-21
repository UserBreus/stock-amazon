const fs = require('fs');

const data = JSON.parse(fs.readFileSync('pdf_data.json', 'utf8'));

let fullText = '';
for (const page of data.Pages) {
    if (page.Texts) {
        for (const pt of page.Texts) {
            fullText += decodeURIComponent(pt.R[0].T) + " ";
        }
    }
}

fs.writeFileSync('extracted_pdf_text.txt', fullText);
console.log("Extracted text saved to extracted_pdf_text.txt");
