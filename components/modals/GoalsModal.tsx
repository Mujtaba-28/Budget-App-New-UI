
import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
const { X, Plus, Target, Trash2, Shield, Plane, Laptop, Home, Gift, Car, GraduationCap, Heart, Coins, ChevronRight, Edit2, Save } = Lucide;
import { Goal } from '../../types';
import { formatMoney, triggerHaptic } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from './ConfirmationModal';

interface GoalsModalProps { onClose: () => void; }

export const GoalsModal: React.FC<GoalsModalProps> = ({ onClose }) => {
    const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
    const { currency } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({ name: '', targetAmount: 0, currentAmount: 0, color: 'bg-emerald-500', icon: 'shield' });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeGoalInput, setActiveGoalInput] = useState<string | null>(null);
    const [customAmount, setCustomAmount] = useState('');

    const icons = [
        { id: 'shield', icon: Shield }, { id: 'plane', icon: Plane }, { id: 'laptop', icon: Laptop },
        { id: 'car', icon: Car }, { id: 'home', icon: Home }, { id: 'gift', icon: Gift },
        { id: 'edu', icon: GraduationCap }, { id: 'health', icon: Heart }, { id: 'save', icon: Coins },
    ];
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-rose-500', 'bg-orange-500'];

    const handleEdit = (goal: Goal) => { setNewGoal({ ...goal }); setEditingId(goal.id); setIsAdding(true); setDeleteId(null); };
    const handleDelete = (id: string) => { deleteGoal(id); triggerHaptic(50); setDeleteId(null); };
    
    const handleSave = () => {
        if (!newGoal.name || !newGoal.targetAmount) return;
        const goalData: Goal = {
            id: editingId || Date.now().toString(),
            name: newGoal.name,
            targetAmount: Number(newGoal.targetAmount),
            currentAmount: Number(newGoal.currentAmount || 0),
            color: newGoal.color || 'bg-emerald-500',
            icon: newGoal.icon || 'shield'
        };
        if (editingId) updateGoal(goalData); else addGoal(goalData);
        triggerHaptic(20);
        setIsAdding(false);
        setEditingId(null);
        setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, color: 'bg-emerald-500', icon: 'shield' });
    };

    const handleUpdateProgress = (goal: Goal, amount: number) => {
        updateGoal({ ...goal, currentAmount: Math.max(0, goal.currentAmount + amount) });
        triggerHaptic(10);
        setActiveGoalInput(null);
        setCustomAmount('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
                <ConfirmationModal isOpen={!!deleteId} title="Delete Goal?" message="Are you sure?" onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />

                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white text-lg">Goals</span>
                    <button onClick={() => { setIsAdding(!isAdding); setEditingId(null); setDeleteId(null); }} className="p-2 -mr-2 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        {isAdding ? <X size={24}/> : <Plus size={24}/>}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-4 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
                        <div className="space-y-4">
                            <input type="text" placeholder="Goal Name" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:border-emerald-500" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} autoFocus/>
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Target</label>
                                    <input type="number" placeholder="0" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:border-emerald-500" value={newGoal.targetAmount || ''} onChange={e => setNewGoal({...newGoal, targetAmount: parseFloat(e.target.value)})} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Saved</label>
                                    <input type="number" placeholder="0" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:border-emerald-500" value={newGoal.currentAmount || ''} onChange={e => setNewGoal({...newGoal, currentAmount: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                                {icons.map(ic => {
                                    const Icon = ic.icon;
                                    return <button key={ic.id} onClick={() => setNewGoal({...newGoal, icon: ic.id})} className={`p-2 rounded-lg ${newGoal.icon === ic.id ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-700 text-slate-400'}`}><Icon size={18}/></button>
                                })}
                            </div>
                            <div className="flex gap-2">
                                {colors.map(c => <button key={c} onClick={() => setNewGoal({...newGoal, color: c})} className={`w-6 h-6 rounded-full ${c} ${newGoal.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}></button>)}
                            </div>

                            <button onClick={handleSave} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                <Save size={18}/> {editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-hide pb-2">
                    {goals.map(goal => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        const Icon = (icons.find(i => i.id === goal.icon) || icons[0]).icon;
                        const isCustom = activeGoalInput === goal.id;

                        return (
                            <div key={goal.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${goal.color} flex items-center justify-center text-white shadow-lg shadow-opacity-20`}>
                                            <Icon size={22} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{goal.name}</h4>
                                            <p className="text-xs font-medium text-slate-400">Target: {formatMoney(goal.targetAmount, currency, false)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(goal)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                        <button onClick={() => setDeleteId(goal.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                
                                <div className="mb-2 flex justify-between items-end">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{formatMoney(goal.currentAmount, currency, false)}</span>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">{progress.toFixed(0)}%</span>
                                </div>

                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
                                    <div className={`h-full rounded-full transition-all duration-500 ${goal.color}`} style={{ width: `${progress}%` }}></div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => handleUpdateProgress(goal, 1000)} className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700">+ 1k</button>
                                    <button onClick={() => handleUpdateProgress(goal, 5000)} className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700">+ 5k</button>
                                    <button onClick={() => setActiveGoalInput(isCustom ? null : goal.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors border border-transparent ${isCustom ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700'}`}>Custom</button>
                                </div>

                                {isCustom && (
                                    <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2">
                                        <input type="number" placeholder="Amount" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold" autoFocus />
                                        <button onClick={() => { if (customAmount) handleUpdateProgress(goal, parseFloat(customAmount)); }} className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl"><ChevronRight size={18}/></button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
