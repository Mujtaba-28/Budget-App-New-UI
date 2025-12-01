
import React, { useRef, useState } from 'react';
import { Upload, Download, Settings, ChevronRight, Save, FolderOpen, FileText, Edit2, RefreshCw, Trash2, Check, Cloud, ShieldAlert, LogOut } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { parseCSV, triggerHaptic, formatDate } from '../../utils';
import { generateMonthlyReport } from '../../utils/pdf';
import { Transaction } from '../../types';
import { ConfirmationModal } from '../modals/ConfirmationModal';

interface AccountsViewProps {
  onOpenSettings: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ onOpenSettings }) => {
    const { transactions, budgets, importTransactions, createBackup, syncToCloud, restoreBackup, userName, setUserName, lastBackupDate, lastCloudSync, resetData } = useFinance();
    const { currency } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const backupInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(userName);
    const [avatarSeed, setAvatarSeed] = useState(userName);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleSaveProfile = () => {
        if (tempName.trim()) {
            setUserName(tempName);
            triggerHaptic(20);
            setIsEditing(false);
        }
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseCSV(text);
            if (parsed.length > 0) {
                const newTxs = parsed.map((p, idx) => ({
                    id: Date.now() + idx,
                    title: p.title || 'Imported',
                    category: p.category || 'Other',
                    amount: p.amount || 0,
                    date: p.date || new Date().toISOString(),
                    type: p.type || 'expense'
                } as Transaction));
                importTransactions(newTxs);
                alert(`Successfully imported ${newTxs.length} transactions.`);
                triggerHaptic(20);
            } else {
                alert('Failed to parse CSV. Please ensure it has valid headers.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (window.confirm("Restoring a backup will OVERWRITE all current data. Are you sure?")) {
                try {
                    await restoreBackup(file);
                } catch (err: any) {
                    alert(`Restore Failed: ${err.message}`);
                }
            }
        }
        e.target.value = '';
    };

    const handleResetApp = () => { triggerHaptic(10); setShowResetConfirm(true); };
    const confirmReset = () => { triggerHaptic(50); resetData(); setShowResetConfirm(false); };

    const ListItem = ({ icon: Icon, label, subLabel, onClick, danger = false }: any) => (
        <button 
            onClick={onClick}
            className={`w-full p-4 flex items-center justify-between group active:bg-slate-50 dark:active:bg-slate-800 transition-colors bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 last:border-none`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    <Icon size={18} strokeWidth={2} />
                </div>
                <div className="text-left">
                    <h4 className={`font-semibold text-sm ${danger ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{label}</h4>
                    {subLabel && <p className="text-xs text-slate-400 mt-0.5">{subLabel}</p>}
                </div>
            </div>
            {!danger && <ChevronRight size={16} className="text-slate-300" />}
        </button>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-8 max-w-md mx-auto pb-10">
            <ConfirmationModal 
                isOpen={showResetConfirm}
                title="Reset Application?"
                message="This will permanently delete ALL transactions, goals, debts, and settings. This cannot be undone."
                onConfirm={confirmReset}
                onCancel={() => setShowResetConfirm(false)}
                confirmText="Reset Everything"
            />

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white px-4 pt-4">Account</h2>
            
            {/* Profile Card */}
            <div className="flex items-center gap-5 px-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-md">
                        <img 
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${isEditing ? avatarSeed : userName}&backgroundColor=b6e3f4`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    {isEditing && (
                        <button 
                            onClick={() => { setAvatarSeed(Math.random().toString(36)); triggerHaptic(5); }}
                            className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-full shadow-lg border-2 border-white"
                        >
                            <RefreshCw size={12} />
                        </button>
                    )}
                </div>
                
                <div className="flex-1">
                        {isEditing ? (
                        <div className="flex items-center gap-2 animate-in fade-in">
                            <input 
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-lg outline-none border-2 border-emerald-500 w-full"
                                autoFocus
                            />
                            <button onClick={handleSaveProfile} className="p-3 bg-emerald-500 text-white rounded-xl shrink-0 shadow-lg shadow-emerald-500/20">
                                <Check size={18} strokeWidth={3} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {userName}
                                </h3>
                                <p className="text-slate-400 text-xs font-semibold mt-1">Free Plan</p>
                            </div>
                            <button onClick={() => { setTempName(userName); setAvatarSeed(userName); setIsEditing(true); triggerHaptic(5); }} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors">
                                Edit
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* General Section */}
            <div className="px-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Settings</h3>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <ListItem icon={Settings} label="Preferences" subLabel="Theme, Currency & Security" onClick={onOpenSettings} />
                </div>
            </div>

            {/* Data Management */}
            <div className="px-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Data & Storage</h3>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <ListItem 
                        icon={Cloud} 
                        label="Cloud Sync" 
                        subLabel={lastCloudSync ? `Synced: ${formatDate(lastCloudSync)}` : 'Backup to Drive/iCloud'} 
                        onClick={() => { syncToCloud(); triggerHaptic(20); }} 
                    />
                    <ListItem 
                        icon={Save} 
                        label="Local Backup" 
                        subLabel={lastBackupDate ? `Last: ${formatDate(lastBackupDate)}` : 'Download .json file'} 
                        onClick={() => { createBackup(); triggerHaptic(20); }} 
                    />
                    <ListItem 
                        icon={FolderOpen} 
                        label="Restore" 
                        subLabel="Import from backup file" 
                        onClick={() => { backupInputRef.current?.click(); triggerHaptic(10); }} 
                    />
                    <input type="file" ref={backupInputRef} onChange={handleRestoreBackup} accept=".json" className="hidden" />

                    <ListItem 
                        icon={FileText} 
                        label="PDF Report" 
                        subLabel="Monthly financial summary" 
                        onClick={() => { generateMonthlyReport(transactions, budgets, new Date(), currency); triggerHaptic(10); }} 
                    />
                    
                    <ListItem 
                        icon={Upload} 
                        label="Export CSV" 
                        subLabel="For Excel/Sheets" 
                        onClick={() => triggerHaptic(10)} 
                    />

                    <ListItem 
                        icon={Download} 
                        label="Import CSV" 
                        subLabel="Bulk entry" 
                        onClick={() => { fileInputRef.current?.click(); triggerHaptic(10); }} 
                    />
                    <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".csv" className="hidden" />
                </div>
            </div>

            {/* Danger Zone */}
            <div className="px-4 pb-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-900/30 overflow-hidden shadow-sm">
                    <ListItem 
                        icon={LogOut} 
                        label="Reset Application" 
                        subLabel="Delete all data" 
                        onClick={handleResetApp} 
                        danger={true} 
                    />
                </div>
                <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-6">
                    Emerald v1.2.0
                </p>
            </div>
        </div>
    )
};
