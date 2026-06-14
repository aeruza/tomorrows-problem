import { ListIcon } from "@/types";

interface IconProps {
    className?: string;
}

function PencilIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.486l1.687-1.688a2.25 2.25 0 113.182 3.182L10.582 20.05a4.5 4.5 0 01-1.897 1.13L6 21.75l1.13-1.605a4.5 4.5 0 011.897-1.13l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
        </svg>
    );
}

function NotepadIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
        </svg>
    );
}

function FriendsIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
        </svg>
    );
}

function GraduationIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15v-3.75m0 0h-.008v.008H6.75V11,25z"/>
        </svg>
    );
}

function BrainIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75a3.75 3.75 0 117.5 0v.75m-7.5-.75a3 3 0 00-3 3v.75m10.5-3.75a3 3 0 013 3v.75M5.25 10.5a3 3 0 000 6h.75m12-6a3 3 0 010 6h-.75M5.25 10.5h.008v.008H5.25V10.5zm13.5 0h.008v.008h-.008V10.5zM9 16.5h6m-7.5 0v1.5a1.5 1.5 0 001.5 1.5h6a1 1.5 0 001.5-1.5V16.5"/>
        </svg>
    );
}

function SyncIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
        </svg>
    );
}
function CodeIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/>
        </svg>
    );
}
function AlertIcon({ className = "w-5 h-5" }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L12.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
            <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none"/>
        </svg>
    );
}

export const PRESET_ICONS: { id: ListIcon; label: string; component: React.FC<IconProps> }[] = [
    { id: null, label: "None", component: () => null },
    { id: "pencil", label: "Pencil", component: PencilIcon },
    { id: "notepad", label: "Notepad", component: NotepadIcon },
    { id: "friends", label: "Friends", component: FriendsIcon },
    { id: "graduation", label: "Graduation", component: GraduationIcon },
    { id: "brain", label: "Brain", component: BrainIcon },
    { id: "sync", label: "Sync", component: SyncIcon },
    { id: "code", label: "Code", component: CodeIcon },
    { id: "alert", label: "Alert", component: AlertIcon },
];

export function ListIconDisplay({ icon, className = "w-5 h-5" }: { icon: ListIcon; className?: string }) {
    if(!icon) return null;
    const preset = PRESET_ICONS.find((preset) => preset.id === icon);
    if(!preset) return null;
    const IconComponent = preset.component;
    return <IconComponent className={className} />;
}

