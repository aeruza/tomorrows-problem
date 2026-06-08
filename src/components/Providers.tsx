"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { TodoProvider } from "@/contexts/TodoContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <TodoProvider>
                {children}
            </TodoProvider>
        </ThemeProvider>
    );
}