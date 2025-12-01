
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
const { X, ChevronLeft, ChevronRight, Save, PieChart, Wallet } = Lucide;
import { EXPENSE_CATEGORIES } from '../../constants';
import { useFinance } from '../../contexts/FinanceContext';
import { triggerHaptic } from '../../utils';

interface BudgetModalProps {
  currentBudget: number;
  onSave: (amount: number, monthKey: string, category?: string) => void;
  onClose: () => void;
  currency: string;
  currentDate: Date;
  changeBudgetMonth: (offset: number) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ currentBudget, onSave, onClose, currency, currentDate, changeBudgetMonth }) => {
    const { budgets, activeContext } = useFinance();
    const [amount, setAmount] = useState(currentBudget);
    const [activeTab, setActiveTab] = useState<'total' | 'category'>('total');
    const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});

    const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const monthKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    useEffect(() => {
        const initialLimits: Record<string, string> = {};
        EXPENSE_CATEGORIES.forEach(cat => {
            const catKey = `${activeContext}-${monthKey}-category-${cat.name}`;
            const val = budgets[catKey];
            initialLimits[cat.name] = val ? val.toString() : '';
        });
        setCategoryLimits(initialLimits);
        setAmount(currentBudget);
    }, [monthKey, budgets, currentBudget, activeContext]);

    const handleCategoryChange = (catName: string, value: string) => {
        setCategoryLimits(prev => ({ ...prev, [catName]: value }));
    };

    const saveAllCategories = () => {
        Object.entries(categoryLimits).forEach(([catName, val]) => {
            const numVal = parseFloat(String(val));
            if (!isNaN(numVal)) {
                onSave(numVal, monthKey, catName);
            } else if (val === '') {
                onSave(0, monthKey, catName);
            }
        });
        triggerHaptic(20);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Budget Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={20} className="text-slate-500"/></button>
                </div>

                <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => changeBudgetMonth(-1)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"><ChevronLeft size={20}/></button>
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{currentMonthName}</span>
                    <button onClick={() => changeBudgetMonth(1)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"><ChevronRight size={20}/></button>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setActiveTab('total')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'total' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                    >
                        <Wallet size={16}/> Total Limit
                    </button>
                    <button 
                        onClick={() => setActiveTab('category')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'category' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                    >
                        <PieChart size={16}/> Category Limits
                    </button>
                </div>
                
                {activeTab === 'total' ? (
                    <div className="animate-in fade-in slide-in-from-right-4">
                        <div className="flex flex-col items-center justify-center mb-8 py-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Maximum Spending</label>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-300">{currency}</span>
                                <input 
                                    type="number" 
                                    value={amount} 
                                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                    className="bg-transparent text-4xl font-bold text-slate-900 dark:text-white outline-none text-center w-40"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mb-6">
                            {[5, 10, -5].map(pct => (
                                <button key={pct} onClick={() => setAmount(prev => Math.round(prev * (1 + pct/100)))} className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition-transform">
                                    {pct > 0 ? '+' : ''}{pct}%
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => { onSave(amount, monthKey); onClose(); }} 
                            className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20}/> Save Limit
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 overflow-hidden">
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide pb-4">
                            {EXPENSE_CATEGORIES.map(cat => {
                                const currentVal = categoryLimits[cat.name] || '';
                                return (
                                    <div key={cat.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}>
                                            <cat.icon size={16} strokeWidth={2}/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 font-bold text-xs">{currency}</span>
                                            <input 
                                                type="number"
                                                placeholder="0"
                                                value={currentVal}
                                                onChange={(e) => handleCategoryChange(cat.name, e.target.value)}
                                                className="w-24 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-sm text-right focus:border-slate-400 transition-all text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                         <button 
                            onClick={saveAllCategories} 
                            className="w-full mt-4 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                            <Save size={20}/> Save Categories
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
};
