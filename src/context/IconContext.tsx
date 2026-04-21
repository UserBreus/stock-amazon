import React, { createContext, useContext, useEffect, useState } from 'react';
import { executeAWSQuery } from '../lib/aws-client';
import * as LucideIcons from 'lucide-react';

interface IconContextType {
    icons: Record<string, { type: 'lucide' | 'svg', value: string }>;
    refreshIcons: () => Promise<void>;
}

const IconContext = createContext<IconContextType>({ icons: {}, refreshIcons: async () => {} });

export function IconProvider({ children }: { children: React.ReactNode }) {
    const [icons, setIcons] = useState<Record<string, { type: 'lucide'|'svg', value: string }>>({});

    const refreshIcons = async () => {
        try {
            const res = await executeAWSQuery("SELECT target_id, icon_type, icon_value FROM WMS_Sys_Icons");
            if (res) {
                const newMap: any = {};
                res.forEach((r: any) => {
                    newMap[r.target_id] = { type: r.icon_type, value: r.icon_value };
                });
                setIcons(newMap);
            }
        } catch(e) { console.error("Error fetching icons:", e); }
    };

    useEffect(() => {
        refreshIcons();
    }, []);

    return <IconContext.Provider value={{ icons, refreshIcons }}>{children}</IconContext.Provider>;
}

export const useSysIcons = () => useContext(IconContext);

export function DynamicIcon({ 
    id, 
    fallback: FallbackIcon, 
    className = "w-5 h-5",
    ...props
}: { 
    id: string; 
    fallback: any; 
    className?: string;
    [key: string]: any;
}) {
    const { icons } = useSysIcons();
    const config = icons[id];

    if (!config) {
        return <FallbackIcon className={className} {...props} />;
    }

    if (config.type === 'lucide') {
        const IconCmp = (LucideIcons as any)[config.value];
        if (IconCmp) return <IconCmp className={className} {...props} />;
        return <FallbackIcon className={className} {...props} />;
    }

    if (config.type === 'svg') {
        return (
             <div 
                 className={className}
                 style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                 dangerouslySetInnerHTML={{ __html: config.value }} 
                 {...props}
             />
        );
    }

    return <FallbackIcon className={className} {...props} />;
}
