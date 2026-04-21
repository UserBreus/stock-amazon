import React, { useRef } from 'react';
import { useUIConfig, DynamicUIIcon } from '../../context/UIContext';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface DraggableUIBlockProps {
    componentId: string;
    fallbackIcon?: any;
    fallbackLabel?: string;
    fallbackSubLabel?: string;
    onClick?: () => void;
    onDropReorder?: (draggedId: string, droppedOnId: string) => void;
    className?: string; // Standard outer styling
    renderType?: 'dashboard_card' | 'sidebar_item';
}

export function DraggableUIBlock({ 
    componentId, 
    fallbackIcon, 
    fallbackLabel, 
    fallbackSubLabel,
    onClick, 
    onDropReorder,
    className,
    renderType = 'dashboard_card'
}: DraggableUIBlockProps) {
    const { uiConfigs, isEditMode, setEditingComponentId, editingComponentId } = useUIConfig();
    const config = uiConfigs[componentId];
    const isBeingEdited = editingComponentId === componentId;

    const handleDragStart = (e: React.DragEvent) => {
        if (!isEditMode) return;
        e.dataTransfer.setData('text/plain', componentId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== componentId && onDropReorder) {
            onDropReorder(draggedId, componentId);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isEditMode) {
            e.preventDefault();
            e.stopPropagation();
            setEditingComponentId(componentId);
        } else if (onClick) {
            onClick();
        }
    };

    if (renderType === 'sidebar_item') {
        const title = config ? config.label : (fallbackLabel || 'Button');
        return (
            <button
                draggable={isEditMode}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
                className={cn(className, isEditMode && 'cursor-move ring-2 ring-transparent hover:ring-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all', isBeingEdited && 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30')}
            >
               <DynamicUIIcon config={config} fallback={fallbackIcon} className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", config ? config.icon_color : "text-slate-400")} />
               <span className="font-bold text-sm tracking-tight truncate">{title}</span>
            </button>
        );
    }

    // Default dashboard card
    return (
        <button 
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            className={cn(
                "border-2 text-left transition-all group flex flex-col items-start hover:shadow-xl relative",
                isEditMode ? "cursor-move ring-4 ring-indigo-500/10 hover:ring-indigo-500/40" : "hover:-translate-y-1",
                isBeingEdited ? "ring-4 ring-indigo-500" : "border-slate-100 dark:border-slate-800",
                config?.bg_color && !isEditMode ? `hover:${config.bg_color.replace('bg-', 'border-')}/50` : "",
                className
            )}
        >
            {isEditMode && <div className="absolute inset-0 bg-white/5 dark:bg-black/5 animate-pulse rounded-3xl pointer-events-none" />}
            
            <div className={cn("p-4 rounded-2xl transition-transform", isEditMode ? "" : "group-hover:scale-110", config ? config.bg_color : "bg-slate-100")}>
                <DynamicUIIcon config={config} fallback={fallbackIcon} className={cn("w-8 h-8", config ? config.icon_color : "text-slate-600")} />
            </div>
            
            <div className="mt-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{config ? config.label : fallbackLabel}</h3>
                <p className="text-slate-500 font-medium text-xs leading-relaxed max-h-[40px] overflow-hidden">
                    {config ? config.sub_label : fallbackSubLabel}
                </p>
            </div>
            
            {isEditMode && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] uppercase font-black px-2 py-1 rounded shadow-md pointer-events-none">Editar</div>
            )}
        </button>
    )
}
