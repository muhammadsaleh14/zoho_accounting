import { useEffect, useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, FileText } from "lucide-react";
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

export function MobileNotificationDropdown({ onClose }: { onClose: () => void }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
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
            case 'success': return <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 size={14} /></div>;
            case 'alert': return <div className="p-1.5 bg-rose-100 text-rose-600 rounded-full dark:bg-rose-900/30 dark:text-rose-400"><AlertCircle size={14} /></div>;
            case 'document': return <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400"><FileText size={14} /></div>;
            default: return <div className="p-1.5 bg-slate-100 text-slate-600 rounded-full dark:bg-slate-800 dark:text-slate-400"><Info size={14} /></div>;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[1px]" onClick={onClose}></div>

            {/* Dropdown - Fixed at top right */}
            <div className="fixed top-4 right-4 z-[110] w-96 max-w-[95vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <span className="text-xs text-slate-400 font-medium">Mark all read</span>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="text-center text-slate-400 py-8 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No new notifications</div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className="flex gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                                <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.description}</p>
                                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        View All History
                    </button>
                </div>
            </div>
        </>
    );
}
