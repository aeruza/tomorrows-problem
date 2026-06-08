"use client";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-scale-in">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={ () => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};