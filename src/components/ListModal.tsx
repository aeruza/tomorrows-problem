"use client";

import { useState } from "react";
import { ListIcon } from "@/types";
import { PRESET_ICONS } from "@/components/ListIcons";

const PRESET_COLOURS = [
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#64748B", // gray
    "#78716C"  // stone
];

interface ColourPickerProps {
    selectedColour: string;
    onSelect: (colour: string) => void;
}

export function ColourPicker({ selectedColour, onSelect }: ColourPickerProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {PRESET_COLOURS.map((colour) => (
                <button
                    key={colour}
                    onClick={() => onSelect(colour)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        selectedColour === colour
                        ? "border-gray-900 dark:border-white scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: colour }}
                    aria-label={`Select colour ${colour}`}
                />
            ))}
        </div>
    );
}

interface IconPickerProps {
    selectedIcon: ListIcon;
    onSelect: (icon: ListIcon) => void;
}

function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {PRESET_ICONS.map((preset) => {
                const isSelected = selectedIcon === preset.id;
                const IconComponent = preset.component;
                return (
                    <button
                        key={preset.id ?? "none"}
                        onClick={() => onSelect(preset.id)}
                        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                            isSelected
                            ? "border-gray-900 dark:border-white bg-neutral-100 dark:bg-neutral-600 scale-110"
                            : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-400"
                            }`}
                            aria-label={`Select icon: ${preset.id}`}
                            title={preset.label}
                    >
                        { preset.id === null ? (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        ) : (
                            <IconComponent className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

interface ListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, colour: string, icon: ListIcon) => void;
    initialName?: string;
    initialColour?: string;
    initialIcon?: ListIcon;
    title: string;
}

export function ListModal({ isOpen, onClose, onSave, initialName = "", initialColour = PRESET_COLOURS[4], initialIcon = null, title }: ListModalProps) {
    const [name, setName] = useState(initialName);
    const [colour, setColour] = useState(initialColour);
    const [icon, setIcon] = useState<ListIcon>(initialIcon);

    if (!isOpen) return null;

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim(), colour, icon);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-in">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    {title}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            List Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter list name"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-all"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Colour
                        </label>
                        <ColourPicker selectedColour={colour} onSelect={setColour} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Icon
                        </label>
                        <IconPicker selectedIcon={icon} onSelect={setIcon} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}