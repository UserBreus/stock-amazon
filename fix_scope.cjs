const fs = require('fs');

try {
    let code = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

    const regex = /const remitoCode = 'REM-'/g;
    code = code.replace(regex, "remitoCode = 'REM-'");
    
    const findIf = `          if (isTransfer) {`;
    const replaceIf = `          let remitoCode = '';\n          if (isTransfer) {`;
    
    code = code.replace(findIf, replaceIf);
    fs.writeFileSync('src/components/DespachoEgresos.tsx', code);
    console.log('Fixed scope TS bug successfully');
} catch (e) {
    console.error(e);
}
