import fs from 'fs';

let tb = fs.readFileSync('src/components/layout/TopBar.tsx', 'utf8');

tb = tb.replace(
    "const { isEditMode, setIsEditMode } = useUIConfig();",
    "const { isEditMode, setIsEditMode, saveAllToDB } = useUIConfig();"
);

// We need to import toast
tb = tb.replace(
    "import { useAuth } from '../../context/AuthContext';",
    "import { useAuth } from '../../context/AuthContext';\nimport toast from 'react-hot-toast';"
);

tb = tb.replace(
    "onClick={() => setIsEditMode(!isEditMode)}",
    `onClick={async () => {
         if (isEditMode) {
             toast.loading("Sincronizando Cambios Visuales...", { id: 'save' });
             await saveAllToDB();
             toast.success("Diseño Guardado en Nube", { id: 'save' });
         }
         setIsEditMode(!isEditMode);
    }}`
);

fs.writeFileSync('src/components/layout/TopBar.tsx', tb);
console.log('TopBar toggle optimized with Saving.');
