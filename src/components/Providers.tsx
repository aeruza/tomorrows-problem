"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TodoProvider } from "@/contexts/TodoContext";

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <TodoProvider>
                    {children}
                </TodoProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}