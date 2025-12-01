
import React from 'react';
import { Transaction } from '../types';
import { getCategoryDetails } from '../constants';
import { formatDate } from '../utils';

interface TransactionItemProps {
  tx: Transaction;
  onClick: (tx: Transaction) => void;
  currency: string;
  isPrivacyMode: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ tx, onClick, currency, isPrivacyMode }) => {
    const catDetails = getCategoryDetails(tx.category, tx.type);
    const Icon = catDetails.icon;
    const isIncome = tx.type === 'income';

    return (
        <div 
            onClick={() => onClick(tx)}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 hover:border-emerald-200 dark:hover:border-emerald-900 transition-all cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md hover:shadow-emerald-500/5"
        >
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 dark:group-hover:bg-indigo-900/20 dark:group-hover:text-indigo-400'}`}>
                 <Icon size={20} strokeWidth={2} className="transition-transform group-hover:scale-110"/>
              </div>
              <div className="flex flex-col gap-0.5">
                 <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tx.title}</h4>
                 <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{tx.category}</p>
              </div>
           </div>
           <div className="text-right">
                <span className={`block font-bold text-sm tabular-nums tracking-tight ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isIncome ? '+' : '-'}{isPrivacyMode ? '****' : `${currency}${Math.abs(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                </span>
           </div>
        </div>
    )
};
