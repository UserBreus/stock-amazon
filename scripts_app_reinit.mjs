import fs from 'fs';

let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(
    "import { IconProvider } from './context/IconContext';", 
    "import { UIProvider } from './context/UIContext';\nimport { UiEditorPanel } from './components/ui/UiEditorPanel';"
);

c = c.replace(
    "<IconProvider>", 
    "<UIProvider>"
);

c = c.replace(
    "</IconProvider>", 
    "</UIProvider>"
);

const toaster = `<Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', fontSize: '14px', borderRadius: '12px' } }} />`;
c = c.replace(toaster, toaster + "\n          <UiEditorPanel />");

fs.writeFileSync('src/App.tsx', c);
console.log("App.tsx initialized with UIProvider and lightweight UiEditorPanel");
