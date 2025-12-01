
import React, { useState, useRef } from 'react';
import * as Lucide from 'lucide-react';
const { X, Trash2, Calendar: CalendarIcon, Edit2, Save, Sparkles, Loader2, Camera, Split, Plus, Minus, Image: ImageIcon, Paperclip } = Lucide;

import { Transaction } from '../../types';
import { useTransactionForm } from '../../hooks/useTransactionForm';
import { CurrencyInput } from '../forms/CurrencyInput';
import { ConfirmationModal } from './ConfirmationModal';

interface TransactionModalProps {
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  onDelete: (id: number) => void;
  initialData: Transaction | null;
  currency: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSave, onDelete, initialData, currency }) => {
    const isEditing = !!initialData;
    const { 
        amount, setAmount, title, setTitle, type, setType, date, setDate,
        category, setCategory, selectedCurrency, setSelectedCurrency,
        originalAmount, setOriginalAmount, isSplitMode, setIsSplitMode,
        splits, setSplits, attachment, setAttachment, isAnalyzing,
        currentCategoryList, currencyCodes,
        handleAttachment, analyzeReceipt, handleAiTextParse, handleSubmit
    } = useTransactionForm(initialData, currency, onSave);

    const [showAiInput, setShowAiInput] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const hasApiKey = !!process.env.API_KEY;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    
    const totalSplitAmount = splits.reduce((acc, s) => acc + (s.amount || 0), 0);
    const splitRemaining = parseFloat(amount || '0') - totalSplitAmount;
    const isSplitValid = Math.abs(splitRemaining) < 1;
    const updateSplit = (idx: number, field: string, val: any) => {
        const newSplits = [...splits]; 
        // @ts-ignore
        newSplits[idx][field] = val; 
        setSplits(newSplits);
    };

    if (showAiInput) {
        return (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="text-emerald-500" size={20}/> AI Auto-Fill</h3>
                        <button onClick={() => setShowAiInput(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} className="text-slate-500"/></button>
                    </div>
                    <textarea 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="e.g. 'Spent 500 on Starbucks for coffee'"
                        className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none outline-none mb-4 text-sm focus:border-slate-900 dark:focus:border-white transition-all font-medium text-slate-900 dark:text-white"
                        autoFocus
                    ></textarea>
                    <button 
                        onClick={() => { handleAiTextParse(textInput); setShowAiInput(false); }} 
                        disabled={isAnalyzing || !textInput.trim()}
                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90"
                    >
                        {isAnalyzing ? <Loader2 size={18} className="animate-spin"/> : <><Sparkles size={18}/> Detect Details</>}
                    </button>
                </div>
            </div>
        )
   }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col relative overflow-hidden">
                
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 shrink-0"></div>

                <ConfirmationModal 
                    isOpen={showDeleteConfirm}
                    title="Delete Transaction?"
                    message="Are you sure? This cannot be undone."
                    onConfirm={() => { if (initialData) onDelete(initialData.id); }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />

                {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                        <Loader2 size={40} className="text-slate-900 dark:text-white animate-spin mb-2" />
                        <span className="font-bold text-slate-900 dark:text-white">Analyzing...</span>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6 shrink-0">
                    <button onClick={onClose} type="button" className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="text-slate-500 dark:text-slate-400" />
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white text-lg">{isEditing ? 'Edit' : 'New Transaction'}</span>
                    <div className="flex gap-1 items-center">
                        {!isEditing && hasApiKey && (
                            <>
                             <button onClick={() => fileInputRef.current?.click()} type="button" className="p-2 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 transition-colors">
                                <Camera size={20}/>
                                <input type="file" ref={fileInputRef} onChange={(e) => {if(e.target.files) analyzeReceipt(e.target.files[0])}} accept="image/*" className="hidden" />
                             </button>
                             <button onClick={() => setShowAiInput(true)} type="button" className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 transition-colors"><Sparkles size={20}/></button>
                            </>
                        )}
                        {isEditing && (
                            <button onClick={() => setShowDeleteConfirm(true)} type="button" className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 flex-1 overflow-y-auto pr-1 pb-safe scrollbar-hide">
                    <CurrencyInput 
                        amount={amount} setAmount={setAmount}
                        originalAmount={originalAmount} setOriginalAmount={setOriginalAmount}
                        selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency}
                        baseCurrency={currency} currencyCodes={currencyCodes}
                    />

                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                        <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>Expense</button>
                        <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Income</button>
                    </div>

                    {/* Date */}
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3">
                        <CalendarIcon size={18} className="text-slate-400" />
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none w-full font-medium text-slate-900 dark:text-white text-sm" />
                    </div>
                    
                    {/* Split Toggle */}
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setIsSplitMode(!isSplitMode)} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isSplitMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <Split size={14}/> {isSplitMode ? 'Split Active' : 'Split Transaction'}
                        </button>
                    </div>

                    {!isSplitMode ? (
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block ml-1">Category</label>
                            <div className="grid grid-cols-4 gap-2">
                                {currentCategoryList.map(cat => (
                                    <button type="button" key={cat.id} onClick={() => setCategory(cat)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${category.id === cat.id ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                        <cat.icon size={20} className="mb-1" strokeWidth={2}/>
                                        <span className="text-[10px] font-bold truncate w-full text-center">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                            <div className="space-y-3">
                                {splits.map((split, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <select value={split.category} onChange={(e) => updateSplit(idx, 'category', e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white">
                                            {currentCategoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <input type="number" value={split.amount} onChange={(e) => updateSplit(idx, 'amount', parseFloat(e.target.value))} className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold outline-none text-right text-slate-900 dark:text-white" placeholder="0"/>
                                        <button type="button" onClick={() => setSplits(splits.filter((_, i) => i !== idx))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"><Minus size={14}/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                <button type="button" onClick={() => setSplits([...splits, { category: currentCategoryList[0].name, amount: 0 }])} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Split</button>
                                <span className={`text-xs font-bold ${isSplitValid ? 'text-emerald-600' : 'text-rose-500'}`}>Total: {totalSplitAmount} / {amount || 0}</span>
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3">
                        <Edit2 size={18} className="text-slate-400" />
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a note" className="bg-transparent outline-none w-full font-medium text-slate-900 dark:text-white text-sm placeholder:text-slate-400" />
                    </div>

                    {/* Attachment */}
                    <div className="space-y-2">
                        <input type="file" ref={attachmentInputRef} onChange={handleAttachment} onClick={(e) => (e.target as HTMLInputElement).value = ''} accept="image/*" className="hidden" />
                        {!attachment ? (
                            <button type="button" onClick={() => attachmentInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-xs font-bold">
                                <Paperclip size={16} /> Attach Receipt
                            </button>
                        ) : (
                            <div className="relative w-full h-32 rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700">
                                <img src={attachment} className="w-full h-full object-cover" alt="attachment" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button type="button" onClick={() => attachmentInputRef.current?.click()} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md"><ImageIcon size={18}/></button>
                                    <button type="button" onClick={() => setAttachment(null)} className="p-2 bg-rose-500/80 hover:bg-rose-600 rounded-full text-white backdrop-blur-md"><X size={18}/></button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <Save size={20} />
                        {isEditing ? 'Update' : 'Save'}
                    </button>
                </form>
            </div>
        </div>
    );
};
