"use client";

import { useAuth } from "@/contexts/AuthContext";
import HomeScreen from "@/components/HomeScreen";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!user) return null;
    return <HomeScreen />;
}