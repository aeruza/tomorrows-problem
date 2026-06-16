"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TodoList, TodoItem, TrashItem, ListIcon } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface TodoContextType {
    lists: TodoList[];
    trash: TrashItem[];
    loading: boolean;
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

function generateId(): string {
    return crypto.randomUUID();
}

export function TodoProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [lists, setLists] = useState<TodoList[]>([]);
    const [trash, setTrash] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
    const [undoSnapshot, setUndoSnapshot] = useState<{ lists: TodoList[]; trash: TrashItem[] } | null>(null);

    // Fetch all data
    const fetchAll = useCallback(async () => {
        if (!user) {
            setLists([]);
            setTrash([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const [listsRes, itemsRes, trashRes] = await Promise.all([
            supabase.from("lists").select("*").eq("user_id", user.id).order("sort_order").order("created_at"),
            supabase.from("items").select("*").eq("user_id", user.id).order("sort_order").order("created_at"),
            supabase.from("trash").select("*").eq("user_id", user.id).order("deleted_at", { ascending: false }).limit(20),
        ]);

        const dbLists = listsRes.data ?? [];
        const dbItems = itemsRes.data ?? [];
        const dbTrash = trashRes.data ?? [];

        const listsWithItems: TodoList[] = dbLists.map((list) => ({
            id: list.id,
            name: list.name,
            colour: list.colour,
            icon: (list.icon as ListIcon) ?? null,
            createdAt: list.created_at,
            items: dbItems
                .filter((item) => item.list_id === list.id)
                .map((item) => ({
                    id: item.id,
                    text: item.text,
                    completed: item.completed,
                    depth: item.depth,
                    createdAt: item.created_at,
                })),
        }));

        const trashItems: TrashItem[] = dbTrash.map((item) => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            depth: item.depth,
            createdAt: item.created_at,
            deletedAt: item.deleted_at,
            originalListId: item.original_list_id,
            originalListName: item.original_list_name,
        }));

        setLists(listsWithItems);
        setTrash(trashItems);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Undo Auto-dismiss
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
        if (undoSnapshot) {
            setLists(undoSnapshot.lists);
            setTrash(undoSnapshot.trash);
            setUndoAction(null);
            setUndoSnapshot(null);
            // Re-fetch to sync with database on next action
        }
    };

    // Lists
    const addList = (name: string, colour: string, icon: ListIcon) => {
        const id = generateId();
        const sortOrder = lists.length;
        const newList: TodoList = {
            id,
            name,
            colour,
            icon,
            items: [],
            createdAt: new Date().toISOString(),
        };
        setLists((prev) => [...prev, newList]);
        supabase.from("lists").insert({ id, user_id: user?.id, name, colour, icon, sort_order: sortOrder });
    }

    const updateList = (id: string, name: string, colour: string, icon: ListIcon) => {
        setLists((prev) => prev.map(list => list.id === id ? { ...list, name, colour, icon } : list));
        supabase.from("lists").update({ name, colour, icon }).eq("id", id);
    }

    const deleteList = (id: string) => {
        const list = lists.find(l => l.id === id);
        saveUndoSnapshot(`Deleted list "${list?.name}"`);
        setLists((prev) => prev.filter(list => list.id !== id));
        supabase.from("lists").delete().eq("id", id);
    }

    const reorderLists = (fromIndex: number, toIndex: number) => {
        if(fromIndex === toIndex) return;
        setLists((prev) => {
            const updated = [...prev];
            const [movedList] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, movedList);

            // Persist new sort order
            updated.forEach((list, index) => {
                supabase.from("lists").update({ sort_order: index }).eq("id", list.id);
            });

            return updated;
        });
    };

    const addItem = (listId: string, text: string) => {
        const id = generateId();
        const list = lists.find((l) => l.id === listId);
        const sortOrder = list ? list.items.length : 0;
        const newItem: TodoItem = {
            id,
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
        supabase.from("items").insert({ id, user_id: user?.id, list_id: listId, text, completed: false, depth: 0, sort_order: sortOrder });
    };

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
        supabase.from("items").update({ text }).eq("id", itemId);
    };
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
                    if ((list.items[i].depth ?? 0) <= targetDepth) break;
                    childIds.add(list.items[i].id);
                }

                const updatedItems = list.items.map((item) => 
                    item.id === itemId || childIds.has(item.id) ? { ...item, completed: newCompleted } : item
                );

                // Persist all toggled
                [itemId, ...childIds].forEach(id => {
                    supabase.from("items").update({ completed: newCompleted }).eq("id", id);
                });

                return {
                    ...list,
                    items: updatedItems,
                }
            })
        );
    };

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
            depth: targetItem.depth ?? 0,
            createdAt: targetItem.createdAt,
            deletedAt: new Date().toISOString(),
            originalListId: list.id,
            originalListName: list.name,
        };

        setTrash((prev) => [trashItem, ...prev].slice(0, 20)); // Keep max 20 items in trash

        const targetDepth = targetItem.depth ?? 0;

        setLists((prev) => 
            prev.map((l) => {
                if(l.id !== listId) return l;

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
                        supabase.from("items").update({ depth: itemDepth - 1 }).eq("id", item.id);
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
        supabase.from("trash").insert({
            id: trashItem.id,
            user_id: user?.id,
            text: trashItem.text,
            completed: trashItem.completed,
            depth: trashItem.depth ?? 0,
            original_list_id: trashItem.originalListId,
            original_list_name: trashItem.originalListName,
            created_at: trashItem.createdAt,
        });
        supabase.from("items").delete().eq("id", itemId);
    }

    const indentItem = (listId: string, itemId: string) => {
        setLists((prev) =>
            prev.map((list) => {
                if(list.id !== listId) return list;
                const index = list.items.findIndex((item) => item.id === itemId);
                if(index < 0) return list;
                const currentDepth = list.items[index].depth ?? 0;

                // Max depth is 2
                if(currentDepth >= 2) return list;

                // Can only indent if there's a previous item at the same or higher depth
                if (index === 0) return list;

                if(currentDepth > (list.items[index - 1].depth ?? 0)) return list;
                const newDepth = currentDepth + 1;
                supabase.from("items").update({ depth: newDepth }).eq("id", itemId);
                return {
                    ...list,
                    items: list.items.map((i) =>
                        i.id === itemId ? { ...i, depth: newDepth } : i
                    )
                };
            })
        );
    };

    const outdentItem = (listId: string, itemId: string) => {
        setLists((prev) =>
            prev.map((list) => {
                if (list.id !== listId) return list;
                const index = list.items.findIndex((item) => item.id === itemId);
                if (index < 0) return list;
                const currentDepth = list.items[index].depth ?? 0;
                if (currentDepth <= 0) return list; // Can't outdent further
                const newDepth = currentDepth - 1;
                supabase.from("items").update({ depth: newDepth }).eq("id", itemId);
                return {
                    ...list,
                    items: list.items.map((i) =>
                        i.id === itemId ? { ...i, depth: newDepth } : i
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

                items.forEach((item, index) => {
                    supabase.from("items").update({ sort_order: index }).eq("id", item.id);
                });
                return { ...list, items };
            })
        );
    };

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
            depth: item.depth ?? 0,
            createdAt: item.createdAt,
            deletedAt: new Date().toISOString(),
            originalListId: listId,
            originalListName: list.name,
        }));

        setTrash((prev) => [...newTrashItems, ...prev].slice(0, 20));
        setLists((prev) => prev.map(l => l.id === listId ? { ...l, items: l.items.filter(item => !item.completed) } : l));

        completedItems.forEach(item => {
            supabase.from("trash").insert({
                id: item.id,
                user_id: user?.id,
                text: item.text,
                completed: item.completed,
                depth: item.depth ?? 0,
                original_list_id: listId,
                original_list_name: list.name,
                created_at: item.createdAt,
            });
            supabase.from("items").delete().eq("list_id", listId).eq("completed", true);
        });
    };

    // Trash
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

        setTrash((prev) => prev.filter(item => item.id !== trashItemId));

        // Try to restore to original list, if it exists
        setLists((prev) => {
            const targetList = prev.find(l => l.id === trashItem.originalListId);
            if(!targetList) {
                const newList: TodoList = {
                    id: generateId(),
                    name: trashItem.originalListName,
                    colour: "#6366f1",
                    icon: null,
                    items: [restoredItem],
                    createdAt: new Date().toISOString(),
                };

                supabase.from("lists").insert({
                    id: newList.id,
                    user_id: user?.id,
                    name: newList.name,
                    colour: newList.colour,
                    sort_order: 9999,
                });
                supabase.from("items").insert({
                    id: restoredItem.id,
                    user_id: user?.id,
                    list_id: newList.id,
                    text: restoredItem.text,
                    completed: restoredItem.completed,
                    depth: 0,
                    sort_order: 0,
                    created_at: restoredItem.createdAt,
                });
                supabase.from("trash").delete().eq("id", trashItemId);
                return [...prev, newList];
            }

            const sortOrder = targetList.items.length;
            supabase.from("items").insert({
                id: restoredItem.id,
                user_id: user?.id,
                list_id: trashItem.originalListId,
                text: restoredItem.text,
                completed: restoredItem.completed,
                depth: 0,
                sort_order: sortOrder,
                created_at: restoredItem.createdAt,
            });
            supabase.from("trash").delete().eq("id", trashItemId);

            return prev.map((l) =>
                l.id === trashItem.originalListId
                    ? { ...l, items: [...l.items, restoredItem] }
                    : l
            );
        });

    };

    const permanentlyDeleteItem = (trashItemId: string) => {
        setTrash((prev) => prev.filter(item => item.id !== trashItemId));
        supabase.from("trash").delete().eq("id", trashItemId);
    }

    const emptyTrash = () => {
        saveUndoSnapshot("Emptied Trash");
        setTrash([]);
        supabase.from("trash").delete().neq("id", ""); // delete all
    }

    return (
        <TodoContext.Provider value={{ 
            lists, trash, loading, addList, updateList, deleteList, addItem, updateItem, toggleItem, deleteItem, 
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

