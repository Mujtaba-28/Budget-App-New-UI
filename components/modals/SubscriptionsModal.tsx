
import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
const { X, Plus, Calendar, Trash2, Zap, LayoutGrid, List, Edit2, Repeat } = Lucide;
import { Subscription } from '../../types';
import { EXPENSE_CATEGORIES } from '../../constants';
import { formatMoney, triggerHaptic } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from './ConfirmationModal';
import { SelectSheet } from '../ui/SelectSheet';

interface SubscriptionsModalProps {
    onClose: () => void;
}

export const SubscriptionsModal: React.FC<SubscriptionsModalProps> = ({ onClose }) => {
    const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useFinance();
    const { currency } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    const [newSub, setNewSub] = useState<Partial<Subscription>>({
        name: '', amount: 0, category: 'Bills', billingCycle: 'monthly', nextBillingDate: new Date().toISOString().split('T')[0], autoPay: false
    });

    const handleEdit = (sub: Subscription) => {
        setNewSub({ ...sub, nextBillingDate: new Date(sub.nextBillingDate).toISOString().split('T')[0] });
        setEditingId(sub.id);
        setIsAdding(true);
        setViewMode('list');
        setDeleteId(null);
    };

    const handleSave = () => {
        if (!newSub.name || !newSub.amount) return;
        const subData: Subscription = {
            id: editingId || Date.now().toString(),
            name: newSub.name,
            amount: Number(newSub.amount),
            billingCycle: newSub.billingCycle as any || 'monthly',
            nextBillingDate: newSub.nextBillingDate ? new Date(newSub.nextBillingDate).toISOString() : new Date().toISOString(),
            category: newSub.category || 'Bills',
            autoPay: newSub.autoPay
        };
        if (editingId) updateSubscription(subData); else addSubscription(subData);
        triggerHaptic(20);
        setIsAdding(false);
        setEditingId(null);
        setNewSub({ name: '', amount: 0, category: 'Bills', billingCycle: 'monthly', nextBillingDate: new Date().toISOString().split('T')[0], autoPay: false });
    };

    const handleDelete = (id: string) => {
        deleteSubscription(id);
        triggerHaptic(50);
        setDeleteId(null);
    };

    const calculateMonthlyCost = (amount: number, cycle: string) => {
        switch(cycle) {
            case 'daily': return amount * 30;
            case 'weekly': return amount * 4.33;
            case 'monthly': return amount;
            case 'quarterly': return amount / 3;
            case 'half-yearly': return amount / 6;
            case 'yearly': return amount / 12;
            default: return amount;
        }
    };

    const totalMonthly = subscriptions.reduce((acc, sub) => acc + calculateMonthlyCost(sub.amount, sub.billingCycle), 0);
    const cycleOptions = [
        { value: 'daily', label: 'Daily', icon: Repeat },
        { value: 'weekly', label: 'Weekly', icon: Repeat },
        { value: 'monthly', label: 'Monthly', icon: Repeat },
        { value: 'quarterly', label: 'Quarterly', icon: Repeat },
        { value: 'half-yearly', label: 'Half Yearly', icon: Repeat },
        { value: 'yearly', label: 'Yearly', icon: Repeat },
    ];
    const categoryOptions = EXPENSE_CATEGORIES.map(c => ({ value: c.name, label: c.name, icon: c.icon }));

    const generateCalendarDays = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); 
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };
    const calendarDays = generateCalendarDays();

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
                
                <ConfirmationModal 
                    isOpen={!!deleteId}
                    title="Delete Subscription?"
                    message="Are you sure? This will stop future reminders."
                    onConfirm={() => deleteId && handleDelete(deleteId)}
                    onCancel={() => setDeleteId(null)}
                />

                <div className="flex justify-between items-center mb-4 shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}><List size={16}/></button>
                        <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}><LayoutGrid size={16}/></button>
                    </div>
                    <button onClick={() => { setIsAdding(!isAdding); setEditingId(null); setDeleteId(null); }} className="p-2 -mr-2 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        {isAdding ? <X size={24}/> : <Plus size={24}/>}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-4 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
                        <h4 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">{editingId ? 'Edit' : 'New'} Subscription</h4>
                        <div className="space-y-3">
                            <input type="text" placeholder="Service Name" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 outline-none text-sm font-bold border border-slate-200 dark:border-slate-700 focus:border-emerald-500" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
                            <div className="flex gap-2">
                                <input type="number" placeholder="Amount" className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 outline-none text-sm font-bold border border-slate-200 dark:border-slate-700 focus:border-emerald-500" value={newSub.amount || ''} onChange={e => setNewSub({...newSub, amount: parseFloat(e.target.value)})} />
                                <div className="flex-1"><SelectSheet label="Cycle" value={newSub.billingCycle || 'monthly'} options={cycleOptions} onChange={(val) => setNewSub({...newSub, billingCycle: val as any})} /></div>
                            </div>
                            <SelectSheet label="Category" value={newSub.category || 'Bills'} options={categoryOptions} onChange={(val) => setNewSub({...newSub, category: val})} />
                            
                            <div onClick={() => setNewSub({...newSub, autoPay: !newSub.autoPay})} className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${newSub.autoPay ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}>
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className={newSub.autoPay ? 'text-indigo-600' : 'text-slate-400'}/>
                                    <span className={`text-xs font-bold ${newSub.autoPay ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-500'}`}>Auto-Pay</span>
                                </div>
                                <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${newSub.autoPay ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${newSub.autoPay ? 'translate-x-3' : ''}`}></div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <input type="date" className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 outline-none text-sm font-bold border border-slate-200 dark:border-slate-700" value={newSub.nextBillingDate} onChange={e => setNewSub({...newSub, nextBillingDate: e.target.value})} />
                                <button onClick={handleSave} className="px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-sm">{editingId ? 'Update' : 'Save'}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-indigo-600 text-white p-5 rounded-2xl mb-4 flex justify-between items-center shadow-lg shadow-indigo-600/20">
                    <div>
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-1">Total Monthly Fixed</p>
                        <h3 className="text-2xl font-bold">{formatMoney(totalMonthly, currency, false)}</h3>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg"><Zap size={20} className="text-white"/></div>
                </div>

                {viewMode === 'list' ? (
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-hide">
                        {subscriptions.map(sub => {
                            const daysLeft = Math.ceil((new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            const isDueSoon = daysLeft >= 0 && daysLeft <= 5;
                            return (
                                <div key={sub.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                                                {sub.name}
                                                {sub.autoPay && <Zap size={10} className="text-indigo-500" fill="currentColor"/>}
                                            </h4>
                                            <p className={`text-[10px] font-bold ${isDueSoon ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {daysLeft < 0 ? 'Overdue' : `Due in ${daysLeft} days`} • <span className="capitalize">{sub.billingCycle}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white mr-2">{formatMoney(sub.amount, currency, false)}</span>
                                        <button onClick={() => handleEdit(sub)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Edit2 size={16}/></button>
                                        <button onClick={() => setDeleteId(sub.id)} className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            )
                        })}
                        {subscriptions.length === 0 && <p className="text-center text-slate-400 text-sm mt-8">No subscriptions yet.</p>}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                             {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, i) => {
                                if (!day) return <div key={i} className="aspect-square"></div>;
                                const bills = subscriptions.filter(s => new Date(s.nextBillingDate).getDate() === day);
                                const isToday = day === new Date().getDate();
                                return (
                                    <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center border ${isToday ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50'}`}>
                                        <span className={`text-[10px] font-bold ${isToday ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}>{day}</span>
                                        {bills.length > 0 && (
                                            <div className="flex -space-x-1 mt-0.5">
                                                {bills.map((b, idx) => (
                                                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ring-1 ring-white ${b.autoPay ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
