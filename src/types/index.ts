export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    depth: number; // 0 = parent, 1 = child, 2 = grandchild
    createdAt: string;
}

export interface TrashItem {
    id: string;
    text: string;
    completed: boolean;
    depth: number;
    createdAt: string;
    deletedAt: string;
    originalListId: string;
    originalListName: string;
}

export type ListIcon = "pencil" | "notepad" | "friends" | "graduation" | "brain" | "sync" | "code" | "alert" | null;

export interface TodoList {
    id: string;
    name: string;
    colour: string;
    icon: ListIcon;
    items: TodoItem[];
    createdAt: string;
}