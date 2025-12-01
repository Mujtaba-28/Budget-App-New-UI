
import React, { useState } from 'react';
import { RefreshCcw, ChevronDown, Check, X } from 'lucide-react';

interface CurrencyInputProps {
    amount: string;
    setAmount: (v: string) => void;
    originalAmount: string;
    setOriginalAmount: (v: string) => void;
    selectedCurrency: string;
    setSelectedCurrency: (v: string) => void;
    baseCurrency: string;
    currencyCodes: Record<string, string>;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    amount, setAmount, originalAmount, setOriginalAmount,
    selectedCurrency, setSelectedCurrency, baseCurrency, currencyCodes
}) => {
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const currencies = [
        { code: '₹', name: 'INR', flag: '🇮🇳' },
        { code: '$', name: 'USD', flag: '🇺🇸' },
        { code: '€', name: 'EUR', flag: '🇪🇺' },
        { code: '£', name: 'GBP', flag: '🇬🇧' },
        { code: 'AED', name: 'AED', flag: '🇦🇪' },
        { code: '¥', name: 'JPY', flag: '🇯🇵' },
    ];

    const isBase = selectedCurrency === baseCurrency;
    const currentFlag = currencies.find(c => c.code === selectedCurrency)?.flag || '🌐';

    if (isSelectionMode) {
        return (
            <div className="absolute inset-0 z-50 bg-white dark:bg-[#0a3831] rounded-[2.5rem] p-6 animate-in fade-in duration-200 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Select Currency</span>
                    <button 
                        onClick={() => setIsSelectionMode(false)}
                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                    >
                        <X size={20} className="text-slate-400 hover:text-rose-500"/>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto scrollbar-hide">
                    {currencies.map(c => (
                        <button 
                            key={c.code} 
                            type="button"
                            onClick={() => { setSelectedCurrency(c.code); setIsSelectionMode(false); }}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 text-left ${selectedCurrency === c.code ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-2 ring-emerald-500 dark:ring-emerald-600' : 'bg-slate-50 dark:bg-black/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-slate-600 dark:text-slate-300'}`}
                        >
                            <span className="text-3xl">{c.flag}</span>
                            <div className="flex flex-col items-start flex-1">
                                <span className="font-bold text-lg">{c.code}</span>
                                <span className="text-[10px] font-bold opacity-60 uppercase">{c.name}</span>
                            </div>
                            {selectedCurrency === c.code && <Check size={20} className="stroke-[3] text-emerald-600"/>}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative">
            {isBase ? (
                <div className="flex flex-col items-center justify-center py-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800/20 transition-all hover:border-emerald-200 dark:hover:border-emerald-700/30">
                    <p className="text-[10px] font-extrabold text-emerald-900/40 dark:text-emerald-100/40 uppercase tracking-widest mb-2">Amount</p>
                    <div className="flex items-center justify-center text-emerald-950 dark:text-emerald-50 w-full px-4 gap-2 sm:gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsSelectionMode(true)}
                            className="flex items-center gap-2 bg-white dark:bg-black/20 pl-3 pr-2 py-2 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-950 dark:text-emerald-50 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95 group shadow-sm shrink-0"
                        >
                            <span className="text-lg leading-none">{currentFlag}</span>
                            <span className="text-lg">{selectedCurrency}</span>
                            <ChevronDown size={14} className="text-emerald-400 group-hover:text-emerald-600 dark:text-emerald-600 dark:group-hover:text-emerald-400" strokeWidth={3}/>
                        </button>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="0" 
                            className="bg-transparent text-4xl sm:text-5xl font-bold text-center w-full outline-none placeholder:text-emerald-900/10 dark:placeholder:text-emerald-100/10 min-w-0" 
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/30 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                            <RefreshCcw size={10}/> Converter Mode
                        </p>
                        <button type="button" onClick={() => setSelectedCurrency(baseCurrency)} className="text-[10px] text-indigo-400/70 hover:text-indigo-600 font-bold underline transition-colors">Reset</button>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                        <button 
                            type="button"
                            onClick={() => setIsSelectionMode(true)}
                            className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-black/20 pl-2 pr-2 py-2 sm:pl-3 sm:pr-2 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 text-indigo-950 dark:text-indigo-50 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-95 group shadow-sm shrink-0"
                        >
                            <span className="text-lg leading-none">{currentFlag}</span>
                            <span className="text-lg">{selectedCurrency}</span>
                            <ChevronDown size={14} className="text-indigo-400 group-hover:text-indigo-600 dark:text-indigo-600 dark:group-hover:text-indigo-400" strokeWidth={3}/>
                        </button>
                        <input 
                            type="number" 
                            value={originalAmount} 
                            onChange={(e) => setOriginalAmount(e.target.value)} 
                            placeholder="Foreign Amount" 
                            className="flex-1 min-w-0 bg-transparent text-xl sm:text-3xl font-bold text-indigo-900 dark:text-indigo-100 outline-none placeholder:text-indigo-900/20 dark:placeholder:text-indigo-100/20"
                        />
                    </div>

                    <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl border border-indigo-100 dark:border-indigo-800/20 flex items-center justify-center gap-2">
                        <span className="text-xs font-bold text-indigo-800 dark:text-indigo-200">
                             Converted: {baseCurrency} {amount || 0}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
