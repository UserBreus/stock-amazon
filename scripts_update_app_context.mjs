import fs from 'fs';

let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(
    "import { IconProvider } from './context/IconContext';", 
    "import { UIProvider } from './context/UIContext';"
);

c = c.replace(
    "<IconProvider>", 
    "<UIProvider>"
);

c = c.replace(
    "</IconProvider>", 
    "</UIProvider>"
);

fs.writeFileSync('src/App.tsx', c);
console.log("App.tsx wrapped with UIProvider");
