import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Info,
    FileText,
    Clock,
    ChevronLeft,
    Check
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";

type NotificationType = 'success' | 'alert' | 'info' | 'document';

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    type: NotificationType;
    read: boolean;
}

export function NotificationsPage({ onBack }: { onBack: () => void }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch real notifications from the backend
                const data = await api.getNotifications();
                setNotifications(data);
            } catch (err) {
                console.error("Failed to load notifications", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <div className="p-2 bg-green-100 text-green-600 rounded-full"><CheckCircle2 size={16} /></div>;
            case 'alert': return <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertCircle size={16} /></div>;
            case 'document': return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><FileText size={16} /></div>;
            default: return <div className="p-2 bg-slate-100 text-slate-600 rounded-full"><Info size={16} /></div>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="pt-12 pb-4 px-6 bg-white border-b border-gray-100 flex items-center gap-4 z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center text-slate-400 py-10">Loading updates...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div key={n.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                            <div className="shrink-0 pt-1">
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{n.title}</h3>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap ml-2">{n.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{n.description}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
