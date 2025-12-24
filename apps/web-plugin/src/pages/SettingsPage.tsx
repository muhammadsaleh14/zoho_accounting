import {
    User,
    Shield,
    Bell,
    Smartphone,
    Globe,
    CreditCard,
    ChevronRight
} from "lucide-react";

export function SettingsPage() {
    const sections = [
        { icon: User, label: 'Profile Settings', desc: 'Manage your personal information, contact details, and official trade license documents.', status: 'Complete' },
        { icon: Shield, label: 'Security & Password', desc: 'Secure your account with 2FA, change your password, and manage active sessions.', status: 'High' },
        { icon: Bell, label: 'Notification Preferences', desc: 'Configure how and when you receive compliance alerts and report generation emails.', status: 'Flexible' },
        { icon: Smartphone, label: 'Connected Devices', desc: 'Manage mobile devices and tablets with access to your Zoho Vault.', status: '3 Active' },
        { icon: Globe, label: 'Language & Region', desc: 'Set your preferred language, time zone, and fiscal year settings.', status: 'English (UK)' },
        { icon: CreditCard, label: 'Subscription & Billing', desc: 'Manage your premium plan, view billing history, and update payment methods.', status: 'Premium' },
    ];

    return (
        <div className="max-w-4xl mx-auto py-4">
            <div className="mb-8 lg:mb-10">
                <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-2 font-medium">Fine-tune your platform experience and account security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {sections.map((section, i) => (
                    <div key={i} className="glass-card p-5 lg:p-6 flex gap-5 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden">
                        <div className="bg-brand-50 p-4 rounded-2xl h-fit text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors shrink-0">
                            <section.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-1">{section.label}</h3>
                            <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed mb-3 pr-4">{section.desc}</p>
                            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md uppercase tracking-wider group-hover:bg-brand-100 transition-colors">
                                {section.status}
                            </span>
                        </div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                            <ChevronRight size={20} className="text-slate-300" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Danger Zone */}
            <div className="mt-8 lg:mt-12 p-6 lg:p-8 border-2 border-dashed border-rose-100 rounded-[2.5rem] bg-rose-50/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <div>
                        <h3 className="text-lg font-bold text-rose-900">Archive Account</h3>
                        <p className="text-sm text-rose-600 font-medium">Once archived, your data will be stored for 7 years as per UAE law.</p>
                    </div>
                    <button className="w-full sm:w-auto px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                        Initiate Archival
                    </button>
                </div>
            </div>
        </div>
    );
}
