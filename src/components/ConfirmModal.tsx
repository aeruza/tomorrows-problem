"use client";

import React, { useEffect, useRef } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
}

export default function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmLabel = "Delete" 
}: ConfirmModalProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        cancelRef.current?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            onClick={onClose}
        >
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                </h2>
                <p id="confirm-modal-desc" className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        ref={cancelRef}
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={ () => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};