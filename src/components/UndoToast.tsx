"use client";

import { useTodo } from "@/contexts/TodoContext";

export default function UndoToast() {
    const { undoAction, undo } = useTodo();

    if (!undoAction) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in">
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl shadow-lg border border-neutral-700 dark:border-neutral-300">
                <span className="text-sm font-medium">{undoAction.label}</span>
                <button
                    onClick={undo}
                    className="text-sm font-bold text-neutral-300 dark:text-neutral-600 hover:text-white dark:hover:text-neutral-900 transition-colors duration-200 underline underline-offset-2">
                    Undo
                </button>
            </div>
        </div>
    );
}