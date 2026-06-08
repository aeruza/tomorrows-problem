"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TodoList, TodoItem, TrashItem, ListIcon } from "@/types";

interface TodoContextType {
    lists: TodoList[];
    trash: TrashItem[];
    addList: (name: string, colour: string, icon: ListIcon) => void;
    updateList: (id: string, name: string, colour: string, icon: ListIcon) => void;
    deleteList: (id: string) => void;
    addItem: (listId: string, text: string) => void;
    updateItem: (listId: string, itemId: string, text: string) => void;
    toggleItem: (listId: string, itemId: string) => void;
    deleteItem: (listId: string, itemId: string) => void;
    indentItem: (listId: string, itemId: string) => void;
    outdentItem: (listId: string, itemId: string) => void;
    reorderItems: (listId: string, fromIndex: number, toIndex: number) => void;
    reorderLists: (fromIndex: number, toIndex: number) => void;
    clearCompleted: (listId: string) => void;
    restoreItem: (trashItemId: string) => void;
    permanentlyDeleteItem: (trashItemId: string) => void;
    emptyTrash: () => void;
    undo: () => void;
    undoAction: UndoAction | null;
}

interface UndoAction {
    label: string;
    timestamp: number;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined); 

const STORAGE_KEY = "todo-app-lists";
const TRASH_STORAGE_KEY = "todo-app-trash";
const MAX_TRASH_ITEMS = 20;

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadLists(): TodoList[] {
    if(typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveLists(lists: TodoList[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

function loadTrash(): TrashItem[] {
    if(typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(TRASH_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveTrash(trash: TrashItem[]) {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trash));
}

export function TodoProvider({ children }: { children: React.ReactNode }) {
    const [lists, setLists] = useState<TodoList[]>([]);
    const [trash, setTrash] = useState<TrashItem[]>([]);
    const [mounted, setMounted] = useState(false);
    const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
    const [undoSnapshot, setUndoSnapshot] = useState<{ lists: TodoList[]; trash: TrashItem[] } | null>(null);

    useEffect(() => {
        setMounted(true);
        setLists(loadLists());
        setTrash(loadTrash());
    }, []);

    useEffect(() => {
        if(mounted) saveLists(lists);
    }, [lists, mounted]);

    useEffect(() => {
        if(mounted) saveTrash(trash);
    }, [trash, mounted]);

    // Auto-dismiss undo after 5 seconds
    useEffect(() => {
        if (!undoAction) return;
        const timer = setTimeout(() => {
            setUndoAction(null);
            setUndoSnapshot(null);
        }, 5000);
        return () => clearTimeout(timer);
    }, [undoAction]);

    const saveUndoSnapshot = (label: string) => {
        setUndoSnapshot({
            lists: JSON.parse(JSON.stringify(lists)),
            trash: JSON.parse(JSON.stringify(trash)),
        });
        setUndoAction({ label, timestamp: Date.now() });
    };

    const undo = () => {
        if (!undoSnapshot) return;
        setLists(undoSnapshot.lists);
        setTrash(undoSnapshot.trash);
        setUndoAction(null);
        setUndoSnapshot(null);
    };

    const addList = (name: string, colour: string, icon: ListIcon) => {
        const newList: TodoList = {
            id: generateId(),
            name,
            colour,
            icon,
            items: [],
            createdAt: new Date().toISOString(),
        };
        setLists((prev) => [...prev, newList]);
    }

    const updateList = (id: string, name: string, colour: string, icon: ListIcon) => {
        setLists((prev) => prev.map(list => list.id === id ? { ...list, name, colour, icon } : list));
    }

    const deleteList = (id: string) => {
        const list = lists.find(l => l.id === id);
        saveUndoSnapshot(`Deleted list "${list?.name}"`);
        setLists((prev) => prev.filter(list => list.id !== id));
    }

    const addItem = (listId: string, text: string) => {
        const newItem: TodoItem = {
            id: generateId(),
            text,
            completed: false,
            depth: 0,
            createdAt: new Date().toISOString(),
        };
        setLists((prev) =>
            prev.map((list) =>
                list.id === listId ? { ...list, items: [...list.items, newItem] } : list
            )
        );
    }

    const updateItem = (listId: string, itemId: string, text: string) => {
        setLists((prev) =>
            prev.map((list) =>
                list.id === listId
                    ? {
                        ...list,
                        items: list.items.map((item) =>
                            item.id === itemId ? { ...item, text } : item
                        ),
                    }
                : list
            )
        );
    }

    const toggleItem = (listId: string, itemId: string) => {
        setLists((prev) =>
            prev.map((list) => {
                if (list.id !== listId) return list;
                const index = list.items.findIndex((item) => item.id === itemId);
                if (index < 0) return list;
                const targetItem = list.items[index];
                const newCompleted = !targetItem.completed;
                const targetDepth = targetItem.depth ?? 0;

                // Find all Children: items that follow this one at a deeper depth
                // stopping when we encounter an item at the same or shallower depth
                const childIds = new Set<string>();
                for(let i = index + 1; i < list.items.length; i++) {
                    const itemDepth = list.items[i].depth ?? 0;
                    if(itemDepth <= targetDepth) break;
                    childIds.add(list.items[i].id);
                }

                return {
                    ...list,
                    items: list.items.map((item) => {
                        if (item.id === itemId || childIds.has(item.id)) {
                            return { ...item, completed: newCompleted };
                        }
                        return item;
                    }),
                }
            })
        );
    }

    const deleteItem = (listId: string, itemId: string) => {
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const index = list.items.findIndex((item) => item.id === itemId);
        if (index < 0) return;
        const targetItem = list.items[index];

        saveUndoSnapshot(`Deleted "${targetItem.text}"`);

        // Move deleted item to trash
        const trashItem: TrashItem = {
            id: targetItem.id,
            text: targetItem.text,
            completed: targetItem.completed,
            depth: targetItem.depth,
            createdAt: targetItem.createdAt,
            deletedAt: new Date().toISOString(),
            originalListId: list.id,
            originalListName: list.name,
        };

        setTrash((prev) => {
            const updated = [trashItem, ...prev];
            
            // Enforce 20 max items in trash
            return updated.slice(0, MAX_TRASH_ITEMS);
        });

        setLists((prev) => 
            prev.map((l) => {
                if(l.id !== listId) return l;
                const targetDepth = l.items[index].depth ?? 0;

                // Promote direct children by reducing their depth by 1
                const updatedItems = l.items.map((item, i) => {
                    if(i <= index) return item;
                    const itemDepth = item.depth ?? 0;
                    if(itemDepth <= targetDepth) return item;
                    let isDescendant = true;
                    for (let j = index + 1; j < i; j++) {
                        if((l.items[j].depth ?? 0) <= targetDepth) {
                            isDescendant = false;
                            break;
                        }
                    }
                    if (isDescendant) {
                        return { ...item, depth: itemDepth - 1 };
                    }
                    return item;
                });

                return {
                    ...l,
                    items: updatedItems.filter((item) => item.id !== itemId),
                };
            })
        );
    }

    const indentItem = (listId: string, itemId: string) => {
        setLists((prev) =>
            prev.map((list) => {
                if(list.id !== listId) return list;
                const index = list.items.findIndex((item) => item.id === itemId);
                if(index < 0) return list;
                const item = list.items[index];
                const currentDepth = item.depth ?? 0;

                // Max depth is 2
                if(currentDepth >= 2) return list;

                // Can only indent if there's a previous item at the same or higher depth
                if (index === 0) return list;
                const prevItem = list.items[index - 1];
                const prevDepth = prevItem.depth ?? 0;
                if (currentDepth > prevDepth) return list;
                return {
                    ...list,
                    items: list.items.map((i) =>
                        i.id === itemId ? { ...i, depth: currentDepth + 1 } : i
                    )
                };
            })
        );
    }

    const outdentItem = (listId: string, itemId: string) => {
        setLists((prev) =>
            prev.map((list) => {
                if (list.id !== listId) return list;
                const index = list.items.findIndex((item) => item.id === itemId);
                if (index < 0) return list;
                const item = list.items[index];
                const currentDepth = item.depth ?? 0;
                if (currentDepth <= 0) return list; // Can't outdent further
                return {
                    ...list,
                    items: list.items.map((i) =>
                        i.id === itemId ? { ...i, depth: currentDepth - 1 } : i
                    )
                };
            })
        );
    }

    const reorderItems = (listId: string, fromIndex: number, toIndex: number) => {
        if(fromIndex === toIndex) return;
        setLists((prev) => 
            prev.map((list) => {
                if (list.id !== listId) return list;
                const items = [...list.items];
                const [movedItem] = items.splice(fromIndex, 1);
                items.splice(toIndex, 0, movedItem);
                return { ...list, items };
            })
        );
    }

    const reorderLists = (fromIndex: number, toIndex: number) => {
        if(fromIndex === toIndex) return;
        setLists((prev) => {
            const updated = [...prev];
            const [movedList] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, movedList);
            return updated;
        });
    }

    const clearCompleted = (listId: string) => {
        const list = lists.find(l => l.id === listId);
        if(!list) return;
        const completedItems = list.items.filter(item => item.completed);
        if(completedItems.length === 0) return;
        
        saveUndoSnapshot(`Cleared ${completedItems.length} completed item${completedItems.length > 1 ? "s" : ""}`);

        const newTrashItems: TrashItem[] = completedItems.map(item => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            depth: item.depth,
            createdAt: item.createdAt,
            deletedAt: new Date().toISOString(),
            originalListId: list.id,
            originalListName: list.name,
        }));

        setTrash((prev) => [...newTrashItems, ...prev].slice(0, MAX_TRASH_ITEMS));
        setLists((prev) => prev.map(l => l.id === listId ? { ...l, items: l.items.filter(item => !item.completed) } : l));
    }

    const restoreItem = (trashItemId: string) => {
        const trashItem = trash.find(item => item.id === trashItemId);
        if(!trashItem) return;
        
        const restoredItem: TodoItem = {
            id: trashItem.id,
            text: trashItem.text,
            completed: trashItem.completed,
            depth: 0, // restore at root level
            createdAt: trashItem.createdAt,
        };

        // Try to restore to original list, if it exists
        setLists((prev) => {
            const targetList = prev.find(l => l.id === trashItem.originalListId);
            if(targetList) {
                const newList: TodoList = {
                    id: generateId(),
                    name: trashItem.originalListName,
                    colour: "#6366f1",
                    icon: "notepad", // Update so it's not notepad - should be able to be nothing   
                    items: [restoredItem],
                    createdAt: new Date().toISOString(),
                };
                return [...prev, newList];
            }

            return prev.map((l) =>
                l.id === trashItem.originalListId
                    ? { ...l, items: [...l.items, restoredItem] }
                    : l
            );
        });

    }

    const permanentlyDeleteItem = (trashItemId: string) => {
        setTrash((prev) => prev.filter(item => item.id !== trashItemId));
    }

    const emptyTrash = () => {
        saveUndoSnapshot("Emptied Trash");
        setTrash([]);
    }

    return (
        <TodoContext.Provider value={{ 
            lists, trash, addList, updateList, deleteList, addItem, updateItem, toggleItem, deleteItem, 
            indentItem, outdentItem, reorderItems, reorderLists, clearCompleted, restoreItem, permanentlyDeleteItem,
            emptyTrash, undo, undoAction
        }}>
            {children}
        </TodoContext.Provider>
    );
}

export function useTodo() {
    const context = useContext(TodoContext);
    if (!context) {
        throw new Error("useTodo must be used within a TodoProvider");
    }
    return context;
}

