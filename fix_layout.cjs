const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Remove the misplaced div completely
const misplacedDivRegex = /<div \s*id="btn_sys_alertas_stock"[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
// Actually, using regex for this nested div is risky. Let's just find and replace by the exact text block.
let lines = c.split('\n');
let newLines = [];
let skip = false;
let openDivs = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('id="btn_sys_alertas_stock"') && line.includes('<div')) {
        skip = true;
        openDivs = 1;
        continue;
    }
    
    if (skip) {
        if (line.includes('<div')) openDivs++;
        if (line.includes('</div')) openDivs--;
        
        if (openDivs === 0) {
            skip = false;
        }
        continue;
    }
    
    newLines.push(line);
}

// Ensure the button of historicos is closed correctly. Let's check where `</button>` for historicos was before my change, it was likely kept because my script injected *inside* `</button>`. Actually, my regex matched `id="btn_sys_historicos"[\s\S]*?</div>`, which replaced the first `</div>` and put the new div there, so the rest of the button was messed up.
// Let's just restore the file from git to undo the bad change, then apply a new one cleanly!
