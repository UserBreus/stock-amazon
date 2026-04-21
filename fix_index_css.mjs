import fs from 'fs';

let txt = fs.readFileSync('src/index.css', 'utf8');
txt = txt.replace(/\\n\\n@media print \{\\n  body \* \{\\n    visibility: hidden;\\n  \}\\n  #print-root, #print-root \* \{\\n    visibility: visible;\\n  \}\\n  #print-root \{\\n    position: absolute;\\n    left: 0;\\n    top: 0;\\n    width: 100vw;\\n  \}\\n  @page \{ margin: 0; \}\\n\}\\n/g, '');

const correctMedia = `
@media print {
  body * {
    visibility: hidden;
  }
  #print-root, #print-root * {
    visibility: visible;
  }
  #print-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
  }
  @page { margin: 0; }
}
`;

if (!txt.includes('@media print {')) {
    txt += correctMedia;
}

fs.writeFileSync('src/index.css', txt);
console.log("index.css fixed");
