"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ListDetail from "@/components/ListDetail";

interface ListDetailPageProps {
    id: string;
}

export default function ListDetailPage({ id }: ListDetailPageProps) {
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

    return <ListDetail listId={id} />;
}