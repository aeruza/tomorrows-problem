"use client";

import { useRef, useState } from "react";
import { useTodo } from "@/contexts/TodoContext";
import { ListModal } from "@/components/ListModal";
import ConfirmModal from "@/components/ConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";
import UndoToast from "@/components/UndoToast";
import { ListIconDisplay } from "@/components/ListIcons";
import { ListIcon } from "@/types";
import Link from "next/link";

type ViewMode = "rows" | "tiles";

export default function HomeScreen() {
    const { lists, trash, addList, updateList, deleteList, reorderLists, restoreItem, permanentlyDeleteItem, emptyTrash } = useTodo();
    const [viewMode, setViewMode] = useState<ViewMode>("tiles");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingList, setEditingList] = useState<{ id: string; name: string; colour: string; icon: ListIcon } | null>(null);
    const [deletingListId, setDeletingListId] = useState<string | null>(null);
    const [showTrash, setShowTrash] = useState(false);
    const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
    const [inlineEditId, setInlineEditId] = useState<string | null>(null);
    const [inlineEditName, setInlineEditName] = useState("");

    // Drag State for reordering lists~
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragNodeRef = useRef<HTMLDivElement | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDragIndex(index);
        dragNodeRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => {
            if (dragNodeRef.current) {
                dragNodeRef.current.style.opacity = "0.4";
            }
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        setDragOverIndex(index);
    }

    const handleDragEnd = () => {
        if (dragNodeRef.current) {
            dragNodeRef.current.style.opacity = "1";
        }
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            reorderLists(dragIndex, dragOverIndex);
        }
        setDragIndex(null);
        setDragOverIndex(null);
        dragNodeRef.current = null;
    }

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleInlineRenameStart = (listId: string, currentName: string) => {
        setInlineEditId(listId);
        setInlineEditName(currentName);
    };

    const handleInlineRenameSave = () => {
        if (inlineEditId && inlineEditName.trim()) {
            const list = lists.find((l) => l.id === inlineEditId);
            if (list) {
                updateList(inlineEditId, inlineEditName.trim(), list.colour, list.icon ?? null);
            }
        }
        setInlineEditId(null);
        setInlineEditName("");
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700/50">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white select-none pointer-events-none">
                        Tomorrow&apos;s Problem
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center bg-neutral-200 dark:bg-neutral-700 rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode("rows")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                                    viewMode === "rows" 
                                        ? "bg-white dark:bg-neutral-600 text-gray-900 dark:text-white shadow-sm"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                Rows
                            </button>
                            <button
                                onClick={() => setViewMode("tiles")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                                    viewMode === "tiles" 
                                        ? "bg-white dark:bg-neutral-600 text-gray-900 dark:text-white shadow-sm"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                Tiles
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {lists.length === 0 ? (
                    <div className="text-center py-20 animate-fade-in">
                        <svg className="w-28 h-28 mx-auto mb-5 text-neutral-200 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.7}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No lists yet
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Create your first list to get started!
                        </p>
                    </div>
                ) : viewMode === "tiles" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {lists.map((list, index) => {
                            const completedCount = list.items.filter((t) => t.completed).length;
                            const totalCount = list.items.length;
                            const isDragOver = dragOverIndex === index && dragIndex !== index;

                            return (
                                <div
                                    key={list.id}
                                    className={`relative group ${isDragOver ? "ring-2 ring-neutral-400 ring-dashed rounded-xl" : ""} ${dragIndex === index ? "opacity-40" : ""}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragLeave={handleDragLeave}
                                >   
                                    <Link href={`/list/${list.id}`}>
                                        <div
                                            className="rounded-xl p-5 h-36 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                                            style={{ backgroundColor: list.colour + "20"}}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: list.colour }}
                                                />
                                                {list.icon && (
                                                    <ListIconDisplay icon={list.icon} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    {inlineEditId === list.id ? (
                                                    <input
                                                        type="text"
                                                        value={inlineEditName}
                                                        onChange={(e) => setInlineEditName(e.target.value)}
                                                        onBlur={handleInlineRenameSave}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleInlineRenameSave();
                                                            if (e.key === "Escape") { setInlineEditId(null); setInlineEditName(""); }
                                                        }}
                                                        className="font-semibold text-gray-900 dark:text-white text-lg bg-transparent border-b border-neutral-400 focus:outline-none w-full"
                                                        autoFocus
                                                        onClick={(e) => e.preventDefault()}
                                                    />
                                                ) : (
                                                    <h3 
                                                        className="font-semibold text-gray-900 dark:text-white text-lg"
                                                        onDoubleClick={(e) => {
                                                            e.preventDefault();
                                                            handleInlineRenameStart(list.id, list.name);
                                                        }}
                                                    >
                                                        {list.name}
                                                    </h3>
                                                )}
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {totalCount}{" "}
                                                    {totalCount === 1 ? "item" : "items"}
                                                    {totalCount > 0 && completedCount > 0 && (
                                                        <span className="text-green-600 dark:text-green-400">
                                                            {" "}&middot; {completedCount} done
                                                        </span>
                                                    )}
                                                </p>
                                                </div>
                                                {totalCount > 0 && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 dark:bg-neutral-700/60 text-gray-600 dark:text-gray-300">
                                                        {completedCount}/{totalCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                    {/* Action Buttons */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingList({
                                                    id: list.id,
                                                    name: list.name,
                                                    colour: list.colour,
                                                    icon: list.icon ?? null,
                                                });
                                            }}
                                            className="p-1.5 rounded-lg bg-white/80 dark:bg-neutral-700/80 hover:bg-white dark:hover:bg-neutral-600 text-gray-600 dark:text-gray-300 shadow-sm transition-all duration-200"
                                            aria-label="Edit List"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingListId(list.id);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/80 dark:bg-neutral-700/80 hover:bg-white dark:hover:bg-neutral-600 text-red-400 shadow-sm transition-all duration-200"
                                            aria-label="Delete List"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {lists.map((list, index) => {
                            const completedCount = list.items.filter((t) => t.completed).length;
                            const totalCount = list.items.length;
                            const isDragOver = dragOverIndex === index && dragIndex !== index;

                            return (
                                <div
                                    key={list.id}
                                    className={`relative group ${isDragOver ? "ring-2 ring-neutral-400 ring-dashed rounded-xl" : ""} ${dragIndex === index ? "opacity-40" : ""}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragLeave={handleDragLeave}
                                >
                                    <Link href={`/list/${list.id}`}>
                                        <div className="flex items-center gap-4 p-4 pr-20 rounded-xl bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: list.colour }}
                                                />
                                                {list.icon && (
                                                    <ListIconDisplay icon={list.icon} className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {inlineEditId === list.id ? (
                                                    <input
                                                        type="text"
                                                        value={inlineEditName}
                                                        onChange={(e) => setInlineEditName(e.target.value)}
                                                        onBlur={handleInlineRenameSave}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleInlineRenameSave();
                                                            if (e.key === "Escape") { setInlineEditId(null); setInlineEditName(""); }
                                                        }}
                                                        className="font-medium text-gray-900 dark:text-white bg-transparent border-b border-neutral-400 focus:outline-none w-full"
                                                        autoFocus
                                                        onClick={(e) => e.preventDefault()}
                                                    />
                                                ) : (
                                                    <h3
                                                        className="font-medium text-gray-900 dark:text-white truncate"
                                                        onDoubleClick={(e) => {
                                                            e.preventDefault();
                                                            handleInlineRenameStart(list.id, list.name);
                                                        }}
                                                    >
                                                        {list.name}
                                                    </h3>
                                                )}
                                            </div>
                                            {totalCount > 0 && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 shrink-0">
                                                    {completedCount}/{totalCount}
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                                                {totalCount}{" "}
                                                {totalCount === 1 ? "item" : "items"}
                                            </span>
                                        </div>
                                    </Link>
                                    {/* Action Buttons */}
                                    <div className="absolute top-1/2 -translate-y-1/2 right-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingList({
                                                    id: list.id,
                                                    name: list.name,
                                                    colour: list.colour,
                                                    icon: list.icon ?? null,
                                                });
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300 transition-all duration-200"
                                            aria-label="Edit List"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingListId(list.id);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-400 transition-all duration-200"
                                            aria-label="Delete List"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Trash Section */}
                {trash.length > 0 && (
                    <div className="mt-10 border-t border-neutral-200 dark:border-neutral-700/50 pt-6">
                        <button
                            onClick={() => setShowTrash(!showTrash)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="font-medium">Trash ({trash.length})</span>
                            <svg className={`w-4 h-4 transition-transform ${showTrash ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showTrash && (
                            <div>
                                <div className="flex justify-end mb-3">
                                    <button
                                        onClick={() => setShowEmptyTrashConfirm(true)}
                                        className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        Empty Trash
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {trash.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-neutral-700/50 animate-slide-up"
                                        >
                                            <span className="flex-1 text-gray-500 dark:text-gray-400 line-through">
                                                {item.text}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                                from {item.originalListName}
                                            </span>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    onClick={() => restoreItem(item.id)}
                                                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-green-500 dark:text-green-400 transition-all duration-200"
                                                    aria-label="Restore Item"
                                                    title="Restore"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => permanentlyDeleteItem(item.id)}
                                                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-400 transition-all duration-200"
                                                    aria-label="Permanently Delete Item"
                                                    title="Delete Permanently"
                                                >   
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Lists Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    tabIndex={-1}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-neutral-800 dark:bg-neutral-200 hover:bg-neutral-700 dark:hover:bg-neutral-300 text-white dark:text-neutral-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center text-2xl focus:outline-none"
                    aria-label="Create New List"
                >
                    +
                </button>
            </main>

            {/* Create Modal */}
            <ListModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={(name, colour, icon) => addList(name, colour, icon)}
                title="Create New List"
            />

            {/* Edit Modal */}
            {editingList && (
                <ListModal
                    isOpen={true}
                    onClose={() => setEditingList(null)}
                    onSave={(name, colour, icon) => {
                        updateList(editingList.id, name, colour, icon);
                        setEditingList(null);
                    }}
                    initialName={editingList.name}
                    initialColour={editingList.colour}
                    initialIcon={editingList.icon ?? undefined}
                    title="Edit List"
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deletingListId}
                onClose={() => setDeletingListId(null)}
                onConfirm={() => {
                    if (deletingListId) deleteList(deletingListId);
                    setDeletingListId(null);
                }}
                title="Delete List"
                message="Are you sure you want to delete this list? All items will be permanently deleted. This action cannot be undone."
            />

            {/* Empty Trash Confirmation Modal */}
            <ConfirmModal
                isOpen={showEmptyTrashConfirm}
                onClose={() => setShowEmptyTrashConfirm(false)}
                onConfirm={() => {
                    emptyTrash();
                    setShowEmptyTrashConfirm(false);
                }}
                title="Empty Trash"
                message="Are you sure you want to empty the trash? All items in the trash will be permanently deleted. This action cannot be undone."
            />
                
            {/* Undo Toast */}
            <UndoToast />
        </div>
    );
}