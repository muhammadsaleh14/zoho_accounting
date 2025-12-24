import {
    CheckCircle2,
    AlertCircle,
    Info,
    FileText,
    Clock,
    Trash2,
    MoreVertical,
    Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface NotificationDropdownProps {
    onClose: () => void;
}

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'success' | 'alert' | 'info' | 'document';
    read: boolean;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchNotifs = async () => {
            const data = await api.getNotifications();
            setNotifications(data);
        };
        fetchNotifs();
    }, []);

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' };
            case 'alert': return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' };
            case 'document': return { icon: FileText, color: 'text-brand-600', bg: 'bg-brand-50' };
            default: return { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' };
        }
    };

    return (
        <div className="absolute top-16 right-4 sm:right-20 w-80 sm:w-96 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <h3 className="font-bold text-slate-900">Notifications</h3>
                <button className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-all">
                    <Trash2 size={12} /> Clear
                </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-2 space-y-2">
                {notifications.map((notif) => {
                    const styles = getTypeStyles(notif.type);
                    return (
                        <div
                            key={notif.id}
                            className={`
                                p-3 rounded-xl flex gap-3 transition-all group relative cursor-pointer
                                ${!notif.read ? "bg-brand-50/30 border border-brand-100/50" : "hover:bg-slate-50"}
                            `}
                        >
                            <div className={`${styles.bg} ${styles.color} p-2 rounded-lg h-fit shrink-0 mt-1`}>
                                <styles.icon size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className={`text-xs font-bold ${!notif.read ? "text-slate-900" : "text-slate-700"}`}>
                                        {notif.title}
                                    </h4>
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                                        {notif.time}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                                    {notif.description}
                                </p>
                            </div>

                            {!notif.read && (
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-500"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <Link
                    to="/notifications"
                    onClick={onClose}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 block w-full py-2"
                >
                    View All Notifications
                </Link>
            </div>
        </div>
    );
}
