
import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
const { X, Sparkles, Shield, LayoutGrid, ChevronDown, ChevronUp } = Lucide;

interface TutorialModalProps { onClose: () => void; }

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
    const [openSection, setOpenSection] = useState<string | null>('ai');
    const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

    const GuideSection = ({ id, title, icon: Icon, color, children }: any) => (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => toggle(id)} className="w-full p-4 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}><Icon size={18} /></div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{title}</span>
                </div>
                {openSection === id ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
            </button>
            {openSection === id && <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-3 font-medium">{children}</div>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={24} className="text-slate-500" /></button>
                    <span className="font-bold text-slate-900 dark:text-white">Guide</span>
                    <div className="w-10"></div>
                </div>
                <div className="overflow-y-auto space-y-3 pb-4 scrollbar-hide">
                    <GuideSection id="ai" title="AI Assistant" icon={Sparkles} color="indigo">
                        Emerald's AI makes adding transactions effortless. Tap the Sparkles icon to chat or use the Camera to scan receipts.
                    </GuideSection>
                    <GuideSection id="data" title="Privacy & Data" icon={Shield} color="emerald">
                        Your data lives 100% on your device. We use browser storage. Create regular backups from the Profile tab.
                    </GuideSection>
                    <GuideSection id="dashboard" title="Dashboard" icon={LayoutGrid} color="teal">
                        Customize your analytics view by tapping the Settings icon in the Analytics tab.
                    </GuideSection>
                </div>
            </div>
        </div>
    );
};
