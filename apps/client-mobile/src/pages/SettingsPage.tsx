import { ChevronLeft, User, Bell, Moon, Cloud, ChevronRight, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../components/ThemeProvider";

export function SettingsPage({ onBack }: { onBack: () => void }) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const { theme, setTheme } = useTheme();
    const [autoUpload, setAutoUpload] = useState(true);

    const isDark = theme === 'dark';

    // Helper to toggle theme
    const toggleTheme = (val: boolean) => {
        setTheme(val ? 'dark' : 'light');
    };

    const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-6 mb-3">{title}</h3>
            <div className="bg-white border-y border-slate-100 divide-y divide-slate-50">
                {children}
            </div>
        </div>
    );

    const ToggleItem = ({ icon: Icon, label, value, onChange }: any) => (
        <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${value ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                    <Icon size={20} />
                </div>
                <span className="font-semibold text-slate-700">{label}</span>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${value ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    const LinkItem = ({ icon: Icon, label, danger = false }: any) => (
        <button className="w-full flex items-center justify-between px-6 py-4 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${danger ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                    <Icon size={20} />
                </div>
                <span className={`font-semibold ${danger ? 'text-red-600' : 'text-slate-700'}`}>{label}</span>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="pt-12 pb-4 px-6 bg-white border-b border-gray-100 flex items-center gap-4 z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto pt-6">

                {/* Profile Card */}
                <div className="px-6 mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            MA
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-lg">Muhammad Afaq</h2>
                            <p className="text-sm text-slate-500">Admin • Pro Plan</p>
                        </div>
                    </div>
                </div>

                <Section title="Preferences">
                    <ToggleItem
                        icon={Bell}
                        label="Push Notifications"
                        value={notificationsEnabled}
                        onChange={setNotificationsEnabled}
                    />
                    <ToggleItem
                        icon={Moon}
                        label="Dark Mode"
                        value={isDark}
                        onChange={toggleTheme}
                    />
                    <ToggleItem
                        icon={Cloud}
                        label="Auto-Upload via WiFi"
                        value={autoUpload}
                        onChange={setAutoUpload}
                    />
                </Section>

                <Section title="Account">
                    <LinkItem icon={User} label="Edit Profile" />
                    <LinkItem icon={Shield} label="Privacy & Security" />
                </Section>

                <Section title="Session">
                    <LinkItem icon={LogOut} label="Log Out" danger />
                </Section>

                <div className="text-center text-xs text-slate-400 pb-10">
                    Version 2.4.0 (Build 1024)
                </div>
            </div>
        </div>
    );
}
