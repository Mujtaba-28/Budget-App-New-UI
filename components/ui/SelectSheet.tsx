
import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
const { X, Check, ChevronDown } = Lucide;

interface Option { value: string; label: string; icon?: React.ElementType; }
interface SelectSheetProps { label: string; value: string; options: Option[]; onChange: (value: string) => void; title?: string; }

export const SelectSheet: React.FC<SelectSheetProps> = ({ label, value, options, onChange, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">{label}</label>
        <button type="button" onClick={() => setIsOpen(true)} className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
          <div className="flex items-center gap-2">
            {selectedOption?.icon && <selectedOption.icon size={18} className="text-slate-500 dark:text-slate-400"/>}
            <span className="text-slate-900 dark:text-white">{selectedOption?.label || value}</span>
          </div>
          <ChevronDown size={16} className="text-slate-400"/>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 duration-300 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-900 dark:text-white ml-2">{title || `Select ${label}`}</span>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><X size={20}/></button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                    {options.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors ${opt.value === value ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <div className="flex items-center gap-3">
                                {opt.icon && <opt.icon size={18} className={opt.value === value ? 'text-white dark:text-slate-900' : 'text-slate-400'}/>}
                                <span className="font-bold text-sm">{opt.label}</span>
                            </div>
                            {opt.value === value && <Check size={16} strokeWidth={3}/>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </>
  );
};
