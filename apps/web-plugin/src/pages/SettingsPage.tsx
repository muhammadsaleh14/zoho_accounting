import {
    User,
    Shield,
    Bell,
    Smartphone,
    Globe,
    CreditCard
} from "lucide-react";

export function SettingsPage() {
    const sections = [
        { icon: User, label: 'Profile Settings', desc: 'Manage your personal information and contact details.' },
        { icon: Shield, label: 'Security & Password', desc: 'Secure your account with 2FA and password management.' },
        { icon: Bell, label: 'Notification Preferences', desc: 'Configure how and when you receive alerts.' },
        { icon: Smartphone, label: 'Connected Devices', desc: 'Manage devices with access to your Zoho Vault.' },
        { icon: Globe, label: 'Language & Region', desc: 'Set your preferred language and time zone.' },
        { icon: CreditCard, label: 'Subscription & Billing', desc: 'Manage your plan and payment methods.' },
    ];

    return (
        <div className="max-w-4xl mx-auto py-4">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-2 font-medium">Fine-tune your platform experience and account security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, i) => (
                    <div key={i} className="glass-card p-6 flex gap-5 hover:scale-[1.02] transition-all cursor-pointer group">
                        <div className="bg-brand-50 p-4 rounded-2xl h-fit text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            <section.icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{section.label}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{section.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Danger Zone */}
            <div className="mt-12 p-8 border-2 border-dashed border-rose-100 rounded-[2.5rem] bg-rose-50/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-rose-900">Archive Account</h3>
                        <p className="text-sm text-rose-600 font-medium">Once archived, your data will be stored for 7 years as per UAE law.</p>
                    </div>
                    <button className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                        Initiate Archival
                    </button>
                </div>
            </div>
        </div>
    );
}
