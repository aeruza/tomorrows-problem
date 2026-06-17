"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

function logError(op: string, error: unknown) {
    if (error) console.error(`[TodoContext] Error during ${op} failed`, error);
}

export function TodoProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [lists, setLists] = useState<TodoList[]>([]);
    const [trash, setTrash] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
    const [undoSnapshot, setUndoSnapshot] = useState<{ lists: TodoList[]; trash: TrashItem[] } | null>(null);

    // Fetch all data
    const fetchAll = async () => {
        if (!user) {
            setLists([]);
            setTrash([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [listsRes, itemsRes, trashRes] = await Promise.all([
                supabase.from("lists").select("*").eq("user_id", user.id).order("sort_order").order("created_at"),
                supabase.from("items").select("*").eq("user_id", user.id).order("sort_order").order("created_at"),
                supabase.from("trash").select("*").eq("user_id", user.id).order("deleted_at", { ascending: false }).limit(20),
            ]);

            if(listsRes.error) throw listsRes.error;
            if(itemsRes.error) throw itemsRes.error;
            if(trashRes.error) throw trashRes.error;
    
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
        } catch (error) {
            logError("fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [user]);

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
        }
    };

    // Lists
    const addList = (name: string, colour: string, icon: ListIcon) => {
        if (!user) return;
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
        supabase.from("lists").insert({ id, user_id: user.id, name, colour, icon, sort_order: sortOrder })
            .then(({ error }) => logError("addList", error));
    };

    const updateList = (id: string, name: string, colour: string, icon: ListIcon) => {
        if (!user) return;
        setLists((prev) => prev.map(list => list.id === id ? { ...list, name, colour, icon } : list));
        supabase.from("lists").update({ name, colour, icon }).eq("id", id).eq("user_id", user.id)
            .then(({ error }) => logError("updateList", error));
    };

    const deleteList = (id: string) => {
        if (!user) return;
        const list = lists.find(l => l.id === id);
        if (!list) return;
        saveUndoSnapshot(`Deleted list "${list.name}"`);
        setLists((prev) => prev.filter(list => list.id !== id));

        const deletedAt = new Date().toISOString();
        const trashPayload = list.items.map(item => ({
            id: item.id,
            user_id: user.id,
            text: item.text,
            completed: item.completed,
            depth: item.depth ?? 0,
            original_list_id: list.id,
            original_list_name: list.name,
            created_at: item.createdAt,
            deleted_at: deletedAt,
        }));

        const newTrashItems: TrashItem[] = list.items.map(item => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            depth: item.depth ?? 0,
            createdAt: item.createdAt,
            deletedAt: deletedAt,
            originalListId: list.id,
            originalListName: list.name,
        }));
        setTrash((prev) => [...newTrashItems, ...prev].slice(0, 20));

        const doDelete = () => supabase.from("lists").delete().eq("id", id).eq("user_id", user.id)
            .then(({ error }) => logError("deleteList", error));

        if (trashPayload.length > 0) {
            supabase.from("trash").insert(trashPayload)
                .then(({ error }) => { logError("deleteList (trash insert)", error); doDelete(); });
        } else {
            doDelete();
        }
    };

    const reorderLists = (fromIndex: number, toIndex: number) => {
        if(!user || fromIndex === toIndex) return;
        setLists((prev) => {
            const updated = [...lists];
            const [movedList] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, movedList);
            setLists(updated);

            updated.forEach((list, index) => {
                supabase.from("lists").update({ sort_order: index }).eq("id", list.id).eq("user_id", user.id)
                    .then(({ error }) => logError("reorderLists", error));
            });

            return updated;
        });
    };

    const addItem = (listId: string, text: string) => {
        if (!user) return;
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
        supabase.from("items").insert({ id, user_id: user.id, list_id: listId, text, completed: false, depth: 0, sort_order: sortOrder })
            .then(({ error }) => logError("addItem", error));
    };

    const updateItem = (listId: string, itemId: string, text: string) => {
        if (!user) return;
        setLists((prev) => prev.map((list) =>
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
        supabase.from("items").update({ text }).eq("id", itemId).eq("user_id", user.id)
            .then(({ error }) => logError("updateItem", error));
    };
    const toggleItem = (listId: string, itemId: string) => {
        if (!user) return;
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const index = list.items.findIndex((item) => item.id === itemId);
        if (index < 0) return list;
        const targetItem = list.items[index];
        const newCompleted = !targetItem.completed;
        const targetDepth = targetItem.depth ?? 0;

        // Find all Children
        const childIds = new Set<string>();
        for (let i = index + 1; i < list.items.length; i++) {
            if ((list.items[i].depth ?? 0) <= targetDepth) break;
            childIds.add(list.items[i].id);
        }

        const allIds = [itemId, ...childIds];

        setLists((prev) => prev.map((l) => {
            if (l.id !== listId) return l;
            return { ...l, items: l.items.map((item) => allIds.includes(item.id) ? { ...item, completed: newCompleted } : item) };
        }));

        supabase.from("items").update({ completed: newCompleted }).in("id", allIds).eq("user_id", user.id)
            .then(({ error }) => logError("toggleItem", error));

    };

    const deleteItem = (listId: string, itemId: string) => {
        if (!user) return;
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const index = list.items.findIndex((item) => item.id === itemId);
        if (index < 0) return;
        const targetItem = list.items[index];

        saveUndoSnapshot(`Deleted "${targetItem.text}"`);

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
        const depthUpdates: { id: string; depth: number }[] = [];

        list.items.forEach((item, i) => {
            if (i <= index) return;
            const itemDepth = item.depth ?? 0;
            if (itemDepth <= targetDepth) return;
            let isDescendant = true;
            for (let j = index + 1; j < i; j++) {
                if((list.items[j].depth ?? 0) <= targetDepth) {
                    isDescendant = false;
                    break;
                }
            }
            if (isDescendant) {
                depthUpdates.push({ id: item.id, depth: itemDepth - 1 });
            }
        });

        setLists((prev) => prev.map((l) => {
            if (l.id !== listId) return l;
            return {
                ...l,
                items: l.items
                    .filter((item) => item.id !== itemId)
                    .map((item) => {
                        const update = depthUpdates.find((d) => d.id === item.id);
                        return update ? { ...item, depth: update.depth } : item;
                    }),
            };
        }));

        // Trash insert first, then delete item - prevents item from disappearing if trash insert fails
        supabase.from("trash").insert({
            id: trashItem.id,
            user_id: user.id,
            text: trashItem.text,
            completed: trashItem.completed,
            depth: trashItem.depth ?? 0,
            original_list_id: trashItem.originalListId,
            original_list_name: trashItem.originalListName,
            created_at: trashItem.createdAt,
            deleted_at: trashItem.deletedAt,
        }).then(({ error }) => {
            if (error) { logError("deleteItem (trash insert)", error); return; }
            supabase.from("items").delete().eq("id", itemId).eq("user_id", user.id)
                .then(({ error }) => {
                    if(error) { logError("deleteItem (item delete)", error); return; }
                    depthUpdates.forEach(( { id, depth} ) => {
                        supabase.from("items").update({ depth }).eq("id", id).eq("user_id", user.id)
                            .then(({ error }) => logError("deleteItem (depth update)", error));
                    });
                });
        });
    }

    const indentItem = (listId: string, itemId: string) => {
        if (!user) return;
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const index = list.items.findIndex((item) => item.id === itemId);
        if (index < 0) return;
        const currentDepth = list.items[index].depth ?? 0;
        // Max depth is 2
        if(currentDepth >= 2 || index === 0) return;

        if(currentDepth > (list.items[index - 1].depth ?? 0)) return;
        const newDepth = currentDepth + 1;
        setLists((prev) => prev.map((l) => 
            l.id !== listId ? l : { ...l, items: l.items.map((i) => i.id === itemId ? { ...i, depth: newDepth } : i) }
        ));
        supabase.from("items").update({ depth: newDepth }).eq("id", itemId).eq("user_id", user.id)
            .then(({ error }) => logError("indentItem", error));
    };

    const outdentItem = (listId: string, itemId: string) => {
        if (!user) return;
        const list = lists.find((l) => l.id === listId);
        if (!list) return;
        const index = list.items.findIndex((item) => item.id === itemId);
        if (index < 0) return;
        const currentDepth = list.items[index].depth ?? 0;
        if (currentDepth <= 0) return;
        const newDepth = currentDepth - 1;
        setLists((prev) => prev.map((l) => 
            l.id !== listId ? l : { ...l, items: l.items.map((i) => i.id === itemId ? { ...i, depth: newDepth } : i) }
        ));
        supabase.from("items").update({ depth: newDepth }).eq("id", itemId).eq("user_id", user.id)
            .then(({ error }) => logError("outdentItem", error));
    };

    const reorderItems = (listId: string, fromIndex: number, toIndex: number) => {

        if(!user || fromIndex === toIndex) return;
        const list = lists.find((l) => l.id === listId);
        if(!list) return;
        const items = [...list.items];
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);

        setLists((prev) => prev.map((l) => l.id === listId ? { ...l, items } : l));
        items.forEach((item, index) => {
            supabase.from("items").update({ sort_order: index }).eq("id", item.id).eq("user_id", user.id)
                .then(({ error }) => logError("reorderItems", error));
        });
    };

    const clearCompleted = (listId: string) => {
        if (!user) return;
        const list = lists.find(l => l.id === listId);
        if (!list) return;
        const completedItems = list.items.filter(item => item.completed);
        if (completedItems.length === 0) return;
        
        saveUndoSnapshot(`Cleared ${completedItems.length} completed item${completedItems.length > 1 ? "s" : ""}`);
        
        const deletedAt = new Date().toISOString();
        const newTrashItems: TrashItem[] = completedItems.map(item => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            depth: item.depth ?? 0,
            createdAt: item.createdAt,
            deletedAt,
            originalListId: listId,
            originalListName: list.name,
        }));

        setTrash((prev) => [...newTrashItems, ...prev].slice(0, 20));
        setLists((prev) => prev.map(l => l.id === listId ? { ...l, items: l.items.filter(item => !item.completed) } : l));

        const completedIds = completedItems.map(item => item.id);

        // Trash insert first, then delete items
            supabase.from("trash").insert(newTrashItems.map(item => ({
                id: item.id,
                user_id: user.id,
                text: item.text,
                completed: item.completed,
                depth: item.depth ?? 0,
                original_list_id: listId,
                original_list_name: list.name,
                created_at: item.createdAt,
                deleted_at: item.deletedAt,
            }))).then(({ error }) => {
                if (error) { logError("clearCompleted (trash insert)", error); return; }
                supabase.from("items").delete().in("id", completedIds).eq("user_id", user.id)
                    .then(({ error }) => logError("clearCompleted (items delete)", error));
            });
    };

    // Trash
    const restoreItem = (trashItemId: string) => {
        if (!user) return null;
        const trashItem = trash.find(item => item.id === trashItemId);
        if (!trashItem) return;
        
        const restoredItem: TodoItem = {
            id: trashItem.id,
            text: trashItem.text,
            completed: trashItem.completed,
            depth: 0,
            createdAt: trashItem.createdAt,
        };

            const targetList = lists.find(l => l.id === trashItem.originalListId);
            if (!targetList) {
                const newList: TodoList = {
                    id: generateId(),
                    name: trashItem.originalListName ?? "Restored List",
                    colour: "#6366f1",
                    icon: null,
                    items: [restoredItem],
                    createdAt: new Date().toISOString(),
                };
                setLists((prev) => [...prev, newList]);
                setTrash((prev) => prev.filter(item => item.id !== trashItemId));

                supabase.from("lists").insert({
                    id: newList.id,
                    user_id: user.id,
                    name: newList.name,
                    colour: newList.colour,
                    icon: null,
                    sort_order: lists.length, // add to end of lists
                }).then(({ error }) => {
                    if (error) { logError("restoreItem (list insert)", error); return; }
                supabase.from("items").insert({
                    id: restoredItem.id,
                    user_id: user.id,
                    list_id: newList.id,
                    text: restoredItem.text,
                    completed: restoredItem.completed,
                    depth: 0,
                    sort_order: 0,
                    created_at: restoredItem.createdAt,
                }).then(({ error: e }) => {
                    if (e) { logError("restoreItem (item insert)", e);  return; }
                    supabase.from("trash").delete().eq("id", trashItemId).eq("user_id", user.id)
                        .then(({ error: te }) => logError("restoreItem (trash delete)", te));
                });
            });
            return;
        }

        const sortOrder = targetList.items.length;
        setLists((prev) => prev.map((l) =>
            l.id === trashItem.originalListId ? { ...l, items: [...l.items, restoredItem] } : l
        ));
        setTrash((prev) => prev.filter(item => item.id !== trashItemId));
        supabase.from("items").insert({
            id: restoredItem.id,
            user_id: user.id,
            list_id: trashItem.originalListId,
            text: restoredItem.text,
            completed: restoredItem.completed,
            depth: 0,
            sort_order: sortOrder,
            created_at: restoredItem.createdAt,
        }).then(({ error }) => { 
            if (error) { logError("restoreItem (item insert)", error); return; }
            supabase.from("trash").delete().eq("id", trashItemId).eq("user_id", user.id)
                .then(({ error: te }) => logError("restoreItem (trash delete)", te));
        });
    };

    const permanentlyDeleteItem = (trashItemId: string) => {
        if (!user) return;
        setTrash((prev) => prev.filter(item => item.id !== trashItemId));
        supabase.from("trash").delete().eq("id", trashItemId).eq("user_id", user.id)
            .then(({ error }) => logError("permanentlyDeleteItem", error));
    };

    const emptyTrash = () => {
        if (!user) return;
        saveUndoSnapshot("Emptied Trash");
        setTrash([]);
        supabase.from("trash").delete().eq("user_id", user.id)
            .then(({ error }) => logError("emptyTrash", error));
    };

    return (
        <TodoContext.Provider value={{ 
            lists, trash, loading, 
            addList, updateList, deleteList, addItem, updateItem, toggleItem, deleteItem, 
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

