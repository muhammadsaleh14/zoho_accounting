import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Info,
    FileText,
    Clock,
    Trash2,
    MoreVertical
} from "lucide-react";

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'success' | 'alert' | 'info' | 'document';
    read: boolean;
}

export function NotificationsPage() {
    const notifications: Notification[] = [
        {
            id: '1',
            title: 'Monthly Report Available',
            description: 'Your P&L statement for December 2025 has been generated and is ready for download in the vault.',
            time: '10 mins ago',
            type: 'success',
            read: false
        },
        {
            id: '2',
            title: 'Compliance Alert',
            description: 'The uploaded document "Inv_992.pdf" is missing a valid TRN. Please host a review.',
            time: '2 hours ago',
            type: 'alert',
            read: false
        },
        {
            id: '3',
            title: 'Document Processing Started',
            description: 'Bulk upload of 12 receipts has been initiated and sent to the bookkeeping queue.',
            time: '5 hours ago',
            type: 'document',
            read: true
        },
        {
            id: '4',
            title: 'System Maintenance',
            description: 'Zoho Vault will be undergoing scheduled maintenance this Sunday from 2 AM to 4 AM GST.',
            time: '1 day ago',
            type: 'info',
            read: true
        }
    ];

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' };
            case 'alert': return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' };
            case 'document': return { icon: FileText, color: 'text-brand-600', bg: 'bg-brand-50' };
            default: return { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' };
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4">
            {/* Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Notifications</h1>
                    <p className="text-slate-500 mt-2 font-medium">Stay updated with your document status and accounting reports.</p>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-2 transition-all">
                    <Trash2 size={14} /> Clear All
                </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {notifications.map((notif) => {
                    const styles = getTypeStyles(notif.type);
                    return (
                        <div
                            key={notif.id}
                            className={`
                glass-card p-6 flex gap-6 transition-all group relative
                ${!notif.read ? "border-l-4 border-l-brand-600 bg-brand-50/10" : "hover:bg-slate-50/50"}
              `}
                        >
                            <div className={`${styles.bg} ${styles.color} p-4 rounded-2xl h-fit shadow-sm`}>
                                <styles.icon size={24} />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`text-lg font-bold ${!notif.read ? "text-slate-900" : "text-slate-700"}`}>
                                        {notif.title}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={12} /> {notif.time}
                                        </span>
                                        <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                    {notif.description}
                                </p>
                                {!notif.read && (
                                    <button className="mt-4 text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State Forecast */}
            {notifications.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm mt-8">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Bell size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                    <p className="text-sm text-slate-400 mt-1">Check back later for new updates.</p>
                </div>
            )}
        </div>
    );
}
