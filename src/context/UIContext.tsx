import React, { createContext, useContext, useEffect, useState } from 'react';
import { executeAWSQuery } from '../lib/aws-client';
import * as LucideIcons from 'lucide-react';
import { useAuth } from './AuthContext';

export interface UIConfig {
    component_id: string;
    group_area: string;
    label: string;
    sub_label?: string;
    icon_type: 'lucide' | 'svg';
    icon_value: string;
    icon_color: string;
    bg_color: string;
    order_index: number;
}

interface UIContextType {
    uiConfigs: Record<string, UIConfig>;
    isEditMode: boolean;
    setIsEditMode: (v: boolean) => void;
    editingComponentId: string | null;
    setEditingComponentId: (id: string | null) => void;
    refreshConfigs: () => Promise<void>;
    updateConfigLocal: (id: string, updates: Partial<UIConfig>) => void;
    saveConfigToDB: (config: UIConfig) => Promise<void>;
    saveAllToDB: () => Promise<void>;
}

const UIContext = createContext<UIContextType>({ 
    uiConfigs: {}, 
    isEditMode: false, 
    setIsEditMode: () => {}, 
    editingComponentId: null,
    setEditingComponentId: () => {},
    refreshConfigs: async () => {},
    updateConfigLocal: () => {},
    saveConfigToDB: async () => {},
    saveAllToDB: async () => {}
});

export function UIProvider({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth();
    const [uiConfigs, setUiConfigs] = useState<Record<string, UIConfig>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingComponentId, setEditingComponentId] = useState<string | null>(null);

    const refreshConfigs = async () => {
        try {
            const res = await executeAWSQuery("SELECT * FROM wms_sys_ui_config ORDER BY order_index ASC");
            if (res) {
                const newMap: any = {};
                res.forEach((r: any) => {
                    newMap[r.component_id] = r;
                });
                setUiConfigs(newMap);
            }
        } catch(e) { console.error("Error fetching UI Configs:", e); }
    };

    useEffect(() => {
        refreshConfigs();
    }, []);

    // Proteccion: Si no es admin/gerente y está en isEditMode, apagarlo.
    useEffect(() => {
        const canEdit = profile?.rol === 'admin' || profile?.rol === 'administrador' || profile?.rol === 'gerente_stock' || profile?.rol === 'administrativo_stock' || profile?.rol === 'encargado' || profile?.is_super_admin;
        if (isEditMode && !canEdit) {
            setIsEditMode(false);
            setEditingComponentId(null);
        }
    }, [isEditMode, profile]);

    const updateConfigLocal = (id: string, updates: Partial<UIConfig>) => {
        setUiConfigs(prev => ({
            ...prev,
            [id]: { ...prev[id], ...updates }
        }));
    };

    const saveConfigToDB = async (config: UIConfig) => {
        const cleanVal = config.icon_value.replace(/'/g, '"');
        const q = `
            IF EXISTS (SELECT 1 FROM wms_sys_ui_config WHERE component_id = '${config.component_id}')
               UPDATE wms_sys_ui_config SET label='${config.label}', sub_label='${config.sub_label || ''}', icon_type='${config.icon_type}', icon_value='${cleanVal}', icon_color='${config.icon_color}', bg_color='${config.bg_color}', order_index=${config.order_index} WHERE component_id = '${config.component_id}';
            ELSE
               INSERT INTO wms_sys_ui_config (component_id, group_area, label, sub_label, icon_type, icon_value, icon_color, bg_color, order_index) VALUES ('${config.component_id}', '${config.group_area}', '${config.label}', '${config.sub_label || ''}', '${config.icon_type}', '${cleanVal}', '${config.icon_color}', '${config.bg_color}', ${config.order_index});
        `;
        await executeAWSQuery(q);
    };

    const saveAllToDB = async () => {
        let qs = '';
        Object.values(uiConfigs).forEach(c => {
            const cleanVal = c.icon_value.replace(/'/g, '"');
            qs += `UPDATE wms_sys_ui_config SET label='${c.label}', sub_label='${c.sub_label || ''}', icon_type='${c.icon_type}', icon_value='${cleanVal}', icon_color='${c.icon_color}', bg_color='${c.bg_color}', order_index=${c.order_index} WHERE component_id = '${c.component_id}';\n`;
        });
        if(qs) await executeAWSQuery(qs);
    };

    return (
        <UIContext.Provider value={{ uiConfigs, isEditMode, setIsEditMode, editingComponentId, setEditingComponentId, refreshConfigs, updateConfigLocal, saveConfigToDB, saveAllToDB }}>
            {children}
        </UIContext.Provider>
    );
}

export const useUIConfig = () => useContext(UIContext);

// Dynamic component to easily render icons based on UIConfig definitions
export function DynamicUIIcon({ 
    id,
    fallback: FallbackIcon, 
    className = "w-5 h-5",
    ...props
}: { 
    id: string;
    fallback?: any; 
    className?: string;
    [key: string]: any;
}) {
    const { uiConfigs } = useUIConfig();
    const config = uiConfigs[id];

    if (!config) {
        return FallbackIcon ? <FallbackIcon className={className} {...props} /> : null;
    }

    if (config.icon_type === 'lucide') {
        const IconCmp = (LucideIcons as any)[config.icon_value];
        if (IconCmp) return <IconCmp className={className} {...props} />;
        return FallbackIcon ? <FallbackIcon className={className} {...props} /> : null;
    }

    if (config.icon_type === 'svg') {
        return (
             <div 
                 className={className}
                 style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                 dangerouslySetInnerHTML={{ __html: config.icon_value }} 
                 {...props}
             />
        );
    }

    return FallbackIcon ? <FallbackIcon className={className} {...props} /> : null;
}
