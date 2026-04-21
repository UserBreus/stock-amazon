import fs from 'fs';

let tb = fs.readFileSync('src/components/layout/TopBar.tsx', 'utf8');

tb = tb.replace(
    "import { useAuth } from '../../context/AuthContext';",
    "import { useAuth } from '../../context/AuthContext';\nimport { useUIConfig } from '../../context/UIContext';\nimport { Edit3 } from 'lucide-react';"
);

tb = tb.replace(
    "const { user, profile, darkMode, toggleDarkMode } = useAuth();",
    "const { user, profile, darkMode, toggleDarkMode } = useAuth();\n  const { isEditMode, setIsEditMode } = useUIConfig();"
);

const moonSunBtn = `<button \n              onClick={toggleDarkMode}`;

const editToggleHtml = `
            {profile?.rol === 'admin' && (
              <button 
                title="Modo Edición del Sistema"
                onClick={() => setIsEditMode(!isEditMode)}
                className={\`p-2.5 rounded-xl transition-all active:scale-90 border \${isEditMode ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-100 dark:hover:border-slate-800'}\`}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
`;

tb = tb.replace(moonSunBtn, editToggleHtml + "\n            " + moonSunBtn);

fs.writeFileSync('src/components/layout/TopBar.tsx', tb);
console.log("TopBar updated with Admin Edit Mode button");
