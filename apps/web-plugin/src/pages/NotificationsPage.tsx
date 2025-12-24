// File: apps/web-plugin/src/pages/NotificationsPage.tsx
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  FileText,
  Clock,
  Trash2,
  MoreVertical,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "alert" | "info" | "document";
  read: boolean;
}

export function NotificationsPage() {
  const notifications: Notification[] = [
    // Dummy data for notifications
    {
      id: "1",
      title: "Monthly Financial Report Generated",
      description: "Your P&L for Dec 2025 is ready.",
      time: "12 mins ago",
      type: "success",
      read: false,
    },
    {
      id: "2",
      title: "Compliance Verification Failed",
      description: "Invoice_INV-2025-001 failed VAT verification.",
      time: "1 hour ago",
      type: "alert",
      read: false,
    },
    {
      id: "3",
      title: "Subscription Renewed",
      description: 'Your "Premium" plan has been renewed.',
      time: "3 hours ago",
      type: "info",
      read: true,
    },
  ];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        };
      case "alert":
        return { icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" };
      case "document":
        return { icon: FileText, color: "text-brand-600", bg: "bg-brand-50" };
      default:
        return { icon: Info, color: "text-slate-600", bg: "bg-slate-100" };
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Stay updated with your document status and reports.
          </p>
        </div>
        <button className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-2 transition-all">
          <Trash2 size={14} /> Clear All
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => {
          const styles = getTypeStyles(notif.type);
          return (
            <div
              key={notif.id}
              className={`glass-card p-4 lg:p-6 flex gap-4 lg:gap-6 transition-all group relative ${!notif.read ? "border-l-4 border-l-brand-600 bg-brand-50/10" : "hover:bg-slate-50/50"}`}
            >
              <div
                className={`${styles.bg} ${styles.color} p-3 lg:p-4 rounded-2xl h-fit shadow-sm shrink-0`}
              >
                <styles.icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row justify-between items-start mb-1 gap-2 lg:gap-0">
                  <h3
                    className={`text-base lg:text-lg font-bold leading-tight ${!notif.read ? "text-slate-900" : "text-slate-700"}`}
                  >
                    {notif.title}
                  </h3>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                      <Clock size={12} /> {notif.time}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl mt-1 lg:mt-0">
                  {notif.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
