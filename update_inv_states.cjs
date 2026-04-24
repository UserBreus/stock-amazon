const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const oldState = "const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<{ [solId: number]: string }>({});";
const newState = `const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<{ [solId: number]: string[] }>({});
  const [isSubModalOriginOpen, setIsSubModalOriginOpen] = useState(false);
  const [remitoPDFInfo, setRemitoPDFInfo] = useState<any>(null);
  const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);
`;

if (code.includes(oldState)) {
    code = code.replace(oldState, newState);
    fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
    console.log("Successfully replaced states variable definitions.");
} else {
    console.log("Could not find the exact oldState string.");
}
