"use client";

import ListDetail from "@/components/ListDetail";

interface ListDetailPageProps {
    id: string;
}

export default function ListDetailPage({ id }: ListDetailPageProps) {
    return <ListDetail listId={id} />;
}