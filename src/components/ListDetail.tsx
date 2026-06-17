"use client"; 

import React, { useState, useRef, useMemo } from "react";
import { useTodo } from "@/contexts/TodoContext";
import ThemeToggle from "@/components/ThemeToggle";
import UndoToast from "@/components/UndoToast";
import Link from "next/link";

type SortMode = "manual" | "completed" | "date-newest" | "date-oldest";

interface ListDetailProps {
    listId: string;
}

export default function ListDetail({ listId }: ListDetailProps) {
    const { lists, loading, addItem, updateItem, toggleItem, deleteItem, indentItem, outdentItem, reorderItems, clearCompleted } = useTodo();
    const [newItemText, setNewItemText] = useState("");
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragNodeRef = useRef<HTMLDivElement | null>(null);
    const dragStartPos = useRef<{ x: number; y: number } | null>(null);
    const [sortMode, setSortMode] = useState<SortMode>("manual");
    const [completedCollapsed, setCompletedCollapsed] = useState(false);

    const list = lists.find((l) => l.id === listId);

    const sortedItems = useMemo(() => {
        if (!list) return [];
        if (sortMode === "manual") return list.items;
        const items = [...list.items];
        switch(sortMode) {
            case "completed":
                return items.sort((a, b) => Number(a.completed) - Number(b.completed));
            case "date-newest":
                return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case "date-oldest":
                return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            default:
                return items;
        }
    }, [list, sortMode]);

    const incompleteItems = useMemo(() => sortedItems.filter((item) => !item.completed), [sortedItems]);
    const completedItems = useMemo(() => sortedItems.filter((item) => item.completed), [sortedItems]);

    const sortedIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        sortedItems.forEach((item, index) => {
            map.set(item.id, index);
        });
        return map;
    }, [sortedItems]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!list) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                        List not found.
                    </p>
                    <Link 
                        href="/" 
                        className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 font-medium transition-colors duration-200"
                        >
                        Go back to home
                    </Link>
                </div>
            </div>
        );
    }

    const handleAddItem = () => {
        if(newItemText.trim()) {
            addItem(listId, newItemText.trim());
            setNewItemText("");
        }
    };

    const handleStartEdit = (itemId: string, currentText: string) => {
        setEditingItemId(itemId);
        setEditingText(currentText);
    };

    const handleSaveEdit = () => {
        if(editingItemId) {
            if (editingText.trim()) {
                updateItem(listId, editingItemId, editingText.trim());
            }
        }
        setEditingItemId(null);
        setEditingText("");
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => { 
        setDragIndex(index);
        dragNodeRef.current = e.currentTarget;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => {
            if (dragNodeRef.current) {
                dragNodeRef.current.style.opacity = "0.4";
            }
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => { 
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragIndex === null || dragIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => { 
        if (dragNodeRef.current) {
            dragNodeRef.current.style.opacity = "1";
        }

        const HORIZONTAL_THRESHOLD = 50;

        const wasCancelled = e.dataTransfer.dropEffect === "none";

        if(!wasCancelled && dragIndex !== null && dragStartPos.current) {
            const deltaX = e.clientX - dragStartPos.current.x;
            const deltaY = e.clientY - dragStartPos.current.y;
            const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > HORIZONTAL_THRESHOLD;

            if (sortMode !== "manual") {
                //
            } else if (isHorizontal) {
                const itemId = sortedItems[dragIndex]?.id;
                if (itemId) {
                    if(deltaX > 0) {
                        indentItem(listId, itemId);
                    } else {
                        outdentItem(listId, itemId);
                    }
                }
            } else if (dragOverIndex !== null && dragIndex !== dragOverIndex) {
                reorderItems(listId, dragIndex, dragOverIndex);
            }
        }

        setDragIndex(null);
        setDragOverIndex(null);
        dragNodeRef.current = null;
        dragStartPos.current = null;
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOverIndex(null);
    };

    const renderItem = (item: typeof sortedItems[number], index: number) => { 
        const depth = item.depth ?? 0;
        const isManual = sortMode === "manual";
        const canIndent =
         isManual && 
         depth < 2 && 
         index > 0 && 
         (sortedItems[index - 1].depth ?? 0) >= depth;
        const canOutdent = isManual && depth > 0;
        const isDragOver = dragOverIndex === index && dragIndex !== index;

        return (
            <div
                draggable={isManual}
                onDragStart={(e) => isManual && handleDragStart(e, index)}
                onDragOver={(e) => isManual && handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                className={`flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800 shadow-sm group transition-all duration-200 ${isManual ? "cursor-grab active:cursor-grabbing" : ""} ${
                    isDragOver 
                        ? "border-2 border-neutral-400 border-dashed" 
                        : "border-2 border-transparent"
                    } ${dragIndex === index ? "opacity-40" : item.completed ? "opacity-60" : ""}`}
                    style={{ marginLeft: isManual ? `${depth * 32}px` : undefined }}
            >
                {/* Drag handle */}
                {isManual && (
                    <div className="shrink-0 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="9" cy="6" r="1.5" />
                            <circle cx="15" cy="6" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" />
                            <circle cx="15" cy="12" r="1.5" />
                            <circle cx="9" cy="18" r="1.5" />
                            <circle cx="15" cy="18" r="1.5" />
                        </svg>
                    </div>
                )}

                {/* Checkbox */}
                <button
                    onClick={() => toggleItem(listId, item.id)}
                    className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
                        item.completed
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 dark:border-gray-600 hover:border-neutral-500"
                    }`}
                    aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {item.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Text + timestamp */}
                <div className="flex-1 min-w-0">
                    {editingItemId === item.id ? (
                        <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if(e.key === "Escape") {
                                    setEditingItemId(null);
                                    setEditingText("");
                                }
                            }}
                            className="w-full px-2 py-1 border border-neutral-300 rounded-xl bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all duration-200"
                            autoFocus
                        />
                    ) : (
                        <>
                            <span
                                className={`block text-gray-900 dark:text-white transition-all ${
                                    item.completed ? "line-through text-gray-400 dark:text-gray-500" : ""
                                }`}
                                onDoubleClick={() => handleStartEdit(item.id, item.text)}
                            >
                                {item.text}
                            </span>
                        </>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {canIndent && (
                        <button
                            onClick={() => indentItem(listId, item.id)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 transition-all duration-200"
                            aria-label="Indent item"
                            title="Indent item"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                            </svg>
                        </button>
                    )}
                    {canOutdent && (
                        <button
                            onClick={() => outdentItem(listId, item.id)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 transition-all duration-200"
                            aria-label="Outdent item"
                            title="Outdent item"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7"/>
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => handleStartEdit(item.id, item.text)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 transition-all duration-200"
                        aria-label="Edit item"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button
                        onClick={() => deleteItem(listId, item.id)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-400 transition-all duration-200"
                        aria-label="Delete item"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700/50">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300 transition-all duration-200"
                            aria-label="Back to lists"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                            </svg>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.colour }} />
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {list.name}
                            </h1>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                {/* Add item input */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add a new reminder or note..."
                        className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all duration-200"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddItem();
                        }}
                    />
                    <button
                        onClick={handleAddItem}
                        disabled={!newItemText.trim()}
                        className="px-5 py-3 bg-neutral-800 dark:bg-neutral-200 hover:bg-neutral-700 dark:hover:bg-neutral-300 text-white dark:text-neutral-900 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
            
                {/* Sort & Clear Controls */}
                {list.items.length > 0 && (
                    <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-neutral-700/50">
                        <div className="flex items-center gap-2">
                            <label htmlFor="sort-mode-select" className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort:</label>
                            <select
                                id="sort-mode-select"
                                value={sortMode}
                                onChange={(e) => setSortMode(e.target.value as SortMode)}
                                className="text-xs px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all duration-200"
                            >
                                <option value="manual">Manual</option>
                                <option value="completed">Completion Status</option>
                                <option value="date-newest">Newest first</option>
                                <option value="date-oldest">Oldest first</option>
                            </select>
                        </div>
                        {list.items.some((i) => i.completed) && (
                            <>
                                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-600" />
                                <button
                                    onClick={() => clearCompleted(listId)}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    Clear completed
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Items List */}
                {list.items.length === 0 ? (
                    <div className="text-center py-16 animate-fade-in">
                        <svg className="w-32 h-32 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.8} style={{ color: list.colour + "80" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            No items yet
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Add your first reminder or note above
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Incomplete items */}
                        <div className="space-y-2">
                            {incompleteItems.map((item) => (
                                <React.Fragment key={item.id}>
                                    {renderItem(item, sortedIndexMap.get(item.id) ?? 0)}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Completed items (collapsible) */}
                        {completedItems.length > 0 && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setCompletedCollapsed(!completedCollapsed)}
                                    aria-expanded={!completedCollapsed}
                                    aria-controls="completed-items"
                                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-2 py-1"
                                >
                                    <svg
                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${completedCollapsed ? "" : "rotate-90"}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="font-medium">
                                        Completed ({completedItems.length})
                                    </span>
                                </button>
                                {!completedCollapsed && (
                                    <div id="completed-items-section" className="space-y-2">
                                        {completedItems.map((item) => (
                                            <React.Fragment key={item.id}>
                                                {renderItem(item, sortedIndexMap.get(item.id) ?? 0)}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Summary */}
                {list.items.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        {list.items.filter((i) => i.completed).length} of { " " }
                        {list.items.length} completed
                    </div>
                )}
            </main>

            {/* Undo Toast */}
            <UndoToast />
        </div>
    );
}
