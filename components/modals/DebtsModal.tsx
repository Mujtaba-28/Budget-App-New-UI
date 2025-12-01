
import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
const { X, Plus, Trash2, TrendingDown, Percent, Wallet, ArrowRight, CheckCircle2, Edit2, Tag, CreditCard, Building } = Lucide;
import { Debt } from '../../types';
import { calculateDebtPayoff, formatMoney, triggerHaptic } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from './ConfirmationModal';
import { SelectSheet } from '../ui/SelectSheet';

interface DebtsModalProps { onClose: () => void; }

export const DebtsModal: React.FC<DebtsModalProps> = ({ onClose }) => {
    const { debts, addDebt, updateDebt, deleteDebt } = useFinance();
    const { currency } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [newDebt, setNewDebt] = useState<Partial<Debt>>({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, category: 'Loan' });
    const [extraPayment, setExtraPayment] = useState(0);

    const handleEdit = (debt: Debt) => { setNewDebt({ ...debt }); setEditingId(debt.id); setIsAdding(true); setDeleteId(null); };
    const handleDelete = (id: string) => { deleteDebt(id); triggerHaptic(50); setDeleteId(null); };
    const handleSave = () => {
        if (!newDebt.name || !newDebt.currentBalance) return;
        const debtData: Debt = {
            id: editingId || Date.now().toString(),
            name: newDebt.name,
            currentBalance: Number(newDebt.currentBalance),
            interestRate: Number(newDebt.interestRate),
            minimumPayment: Number(newDebt.minimumPayment),
            category: newDebt.category || 'Loan'
        };
        if (editingId) updateDebt(debtData); else addDebt(debtData);
        triggerHaptic(20);
        setIsAdding(false);
        setEditingId(null);
        setNewDebt({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, category: 'Loan' });
    };

    const payoff = calculateDebtPayoff(debts, extraPayment, 'avalanche');
    const newPercent = (payoff.months / (payoff.baselineMonths || 1)) * 100;
    const debtCategories = [ { value: 'Credit Card', label: 'Credit Card', icon: CreditCard }, { value: 'Loan', label: 'Personal Loan', icon: Wallet }, { value: 'Mortgage', label: 'Mortgage', icon: Building }, { value: 'Other', label: 'Other', icon: Tag } ];

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
                <ConfirmationModal isOpen={!!deleteId} title="Delete Debt?" message="This will remove it from the planner." onConfirm={() => deleteId && handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />

                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={24} className="text-slate-500"/></button>
                    <span className="font-bold text-slate-900 dark:text-white text-lg">Debt Planner</span>
                    <button onClick={() => { setIsAdding(!isAdding); setEditingId(null); setDeleteId(null); }} className="p-2 -mr-2 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">{isAdding ? <X size={24}/> : <Plus size={24}/>}</button>
                </div>

                {isAdding && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-4 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
                        <h4 className="font-bold text-sm mb-4 text-slate-900 dark:text-white">{editingId ? 'Edit Liability' : 'Add Liability'}</h4>
                        <div className="space-y-4">
                            <input type="text" placeholder="Name" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 outline-none text-sm font-bold border border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white transition-all" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} />
                            <SelectSheet label="Type" value={newDebt.category || 'Loan'} options={debtCategories} onChange={(val) => setNewDebt({...newDebt, category: val})} />
                            <div className="flex gap-3">
                                <input type="number" placeholder="Balance" className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 outline-none text-sm font-bold border border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white transition-all" value={newDebt.currentBalance || ''} onChange={e => setNewDebt({...newDebt, currentBalance: parseFloat(e.target.value)})} />
                                <input type="number" placeholder="APR %" className="w-24 p-3 rounded-xl bg-white dark:bg-slate-900 outline-none text-sm font-bold border border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white transition-all" value={newDebt.interestRate || ''} onChange={e => setNewDebt({...newDebt, interestRate: parseFloat(e.target.value)})} />
                            </div>
                            <div className="flex gap-3">
                                <input type="number" placeholder="Min Payment" className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 outline-none text-sm font-bold border border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white transition-all" value={newDebt.minimumPayment || ''} onChange={e => setNewDebt({...newDebt, minimumPayment: parseFloat(e.target.value)})} />
                                <button onClick={handleSave} className="px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-sm">{editingId ? 'Update' : 'Save'}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl mb-4 border border-indigo-100 dark:border-indigo-900/30 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 font-bold">
                            <TrendingDown size={18} className="text-indigo-500"/> Simulator
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Extra</span>
                            <div className="flex items-center">
                                <span className="text-xs font-bold text-slate-400 mr-1">{currency}</span>
                                <input type="number" value={extraPayment || ''} onChange={e => setExtraPayment(parseFloat(e.target.value) || 0)} className="w-16 bg-transparent text-right font-bold text-indigo-600 dark:text-indigo-400 outline-none text-sm" placeholder="0"/>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1.5 text-slate-400"><span>Current Path</span><span>{(payoff.baselineMonths/12).toFixed(1)} Years</span></div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full"><div className="h-full bg-slate-400 rounded-full w-full"></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold mb-1.5 text-emerald-600"><span>With Extra</span><span>{(payoff.months/12).toFixed(1)} Years</span></div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full"><div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${newPercent}%` }}></div></div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-hide">
                    {debts.map(debt => (
                        <div key={debt.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{debt.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mt-0.5">
                                        <span className="flex items-center gap-0.5"><Tag size={10}/> {debt.category}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5"><Percent size={10}/> {debt.interestRate}% APR</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">{formatMoney(debt.currentBalance, currency, false)}</span>
                                <div className="flex gap-1">
                                     <button onClick={() => handleEdit(debt)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"><Edit2 size={16} /></button>
                                     <button onClick={() => setDeleteId(debt.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
