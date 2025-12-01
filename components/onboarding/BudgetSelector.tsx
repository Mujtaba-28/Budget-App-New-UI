
import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
const { User, Briefcase, Plus, X, Folder, Check, Trash2, Edit2, Home, Car, Gift, Zap, ShoppingBag, Plane, Coffee, CreditCard, Heart, Laptop, Smartphone, Smile, Search, ChevronRight } = Lucide;
import { useFinance } from '../../contexts/FinanceContext';
import { BudgetContext, ContextMetadata } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { SelectSheet } from '../ui/SelectSheet';

interface BudgetSelectorProps {
  onSelect: (context: BudgetContext) => void;
  userName: string;
}

const availableIcons = [
    { name: 'Folder', icon: Folder }, { name: 'User', icon: User }, { name: 'Briefcase', icon: Briefcase },
    { name: 'Home', icon: Home }, { name: 'Car', icon: Car }, { name: 'Gift', icon: Gift }, { name: 'Zap', icon: Zap },
    { name: 'ShoppingBag', icon: ShoppingBag }, { name: 'Plane', icon: Plane }, { name: 'Coffee', icon: Coffee },
    { name: 'CreditCard', icon: CreditCard }, { name: 'Heart', icon: Heart }, { name: 'Laptop', icon: Laptop },
    { name: 'Smartphone', icon: Smartphone }, { name: 'Smile', icon: Smile },
];

export const BudgetSelector: React.FC<BudgetSelectorProps> = ({ onSelect, userName }) => {
  const { customContexts, addContext, deleteContext, updateContext, budgets, updateBudget } = useFinance();
  const { currency } = useTheme();
  
  const [isEditingList, setIsEditingList] = useState(false);
  const [formState, setFormState] = useState<{ mode: 'create' | 'edit'; context?: ContextMetadata } | null>(null);
  
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Form fields state
  const [name, setName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [timeline, setTimeline] = useState<'weekly' | 'monthly' | 'yearly' | 'one-time'>('monthly');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (customContexts.length === 0) {
        setFormState({ mode: 'create' });
        if (!name) setName('Personal');
        if (selectedIcon === 'Folder') setSelectedIcon('User');
    }
  }, [customContexts.length]); 

  const openForm = (mode: 'create' | 'edit', context?: ContextMetadata) => {
    setFormState({ mode, context });
    if (mode === 'edit' && context) {
        setName(context.name);
        setDescription(context.description || '');
        setTimeline(context.timeline);
        setSelectedIcon(context.icon || 'Folder');
        setStartDate(context.startDate || '');
        setEndDate(context.endDate || '');
        
        const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const specificBudgetKey = `${context.id}-${currentMonthKey}`;
        const defaultBudgetKey = `${context.id}-default`;

        const amount = budgets[specificBudgetKey] ?? budgets[defaultBudgetKey];
        setBudgetAmount(amount ? amount.toString() : '');
    } else {
        setName(customContexts.length === 0 ? 'Personal' : '');
        setBudgetAmount('');
        setDescription('');
        setTimeline('monthly');
        setSelectedIcon(customContexts.length === 0 ? 'User' : 'Folder');
        setStartDate('');
        setEndDate('');
    }
  };

  const closeForm = () => {
    if (customContexts.length > 0) {
        setFormState(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && (formState || customContexts.length === 0)) {
        const mode = formState?.mode || (customContexts.length === 0 ? 'create' : 'edit');
        const amount = parseFloat(budgetAmount) || 0;
        const payload = {
            name: name.trim(),
            description,
            timeline,
            budgetAmount: amount,
            icon: selectedIcon,
            startDate: timeline === 'one-time' ? startDate : undefined,
            endDate: timeline === 'one-time' ? endDate : undefined
        };

        if (mode === 'create') {
            const newId = addContext(payload as any);
            if (newId) {
                const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                updateBudget(amount, currentMonthKey, undefined, newId);
                updateBudget(amount, 'default', undefined, newId);
                if (customContexts.length === 0) onSelect(newId);
            }
        } else if (mode === 'edit' && formState?.context) {
            updateContext(formState.context.id, payload);
             const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
             updateBudget(amount, currentMonthKey, undefined, formState.context.id);
             updateBudget(amount, 'default', undefined, formState.context.id);
        }
        
        if(customContexts.length > 0) closeForm();
    }
  };

  const handleDelete = () => {
      if (deleteId) {
          deleteContext(deleteId);
          setDeleteId(null);
      }
  };

  const timelineOptions = [
      { value: 'monthly', label: 'Monthly' }, 
      { value: 'weekly', label: 'Weekly' },
      { value: 'yearly', label: 'Yearly' }, 
      { value: 'one-time', label: 'One-Time Event' },
  ];
  
  const renderForm = () => {
    const mode = formState?.mode || (customContexts.length === 0 ? 'create' : 'edit');
    const SelectedIconComponent = availableIcons.find(i => i.name === selectedIcon)?.icon || Folder;

    return (
     <div className={`fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300`}>
        <div className={`w-full max-w-sm transition-opacity duration-300 ${showIconPicker ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                        {mode === 'create' ? (customContexts.length === 0 ? 'Welcome' : 'New Budget') : 'Edit Budget'}
                    </h3>
                    {customContexts.length > 0 && <button type="button" onClick={closeForm} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={20} className="text-slate-500"/></button>}
                </div>
                
                <div className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-hide">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Name & Icon</label>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowIconPicker(true)} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <SelectedIconComponent size={20}/>
                            </button>
                            <input type="text" autoFocus placeholder="Budget Name" className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white outline-none font-bold text-slate-900 dark:text-white text-sm" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Limit</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{currency}</span>
                            <input type="number" placeholder="0" className="w-full p-3 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white outline-none font-bold text-slate-900 dark:text-white text-sm" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
                        </div>
                    </div>
                    
                    <div>
                         <SelectSheet label="Timeline" value={timeline} options={timelineOptions} onChange={(val) => setTimeline(val as any)} title="Select Timeline" />
                    </div>

                    {timeline === 'one-time' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Start</label>
                                <input type="date" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-900 outline-none font-bold text-slate-900 dark:text-white text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">End</label>
                                <input type="date" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-900 outline-none font-bold text-slate-900 dark:text-white text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Description</label>
                        <input type="text" placeholder="Optional" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-900 outline-none font-medium text-slate-900 dark:text-white text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>

                <div className="flex gap-3 pt-6">
                    {customContexts.length > 0 && <button type="button" onClick={closeForm} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancel</button>}
                    <button type="submit" disabled={!name.trim()} className="flex-[2] p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl disabled:opacity-50 font-bold text-sm shadow-md">{mode === 'create' ? 'Create' : 'Save'}</button>
                </div>
            </form>
        </div>
        {showIconPicker && (
            <IconPicker onSelect={(iconName) => { setSelectedIcon(iconName); setShowIconPicker(false); }} onClose={() => setShowIconPicker(false)} />
        )}
     </div>
    )
  };

  if (customContexts.length === 0) {
      return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
            {renderForm()}
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <ConfirmationModal isOpen={!!deleteId} title="Delete Budget?" message="This will permanently delete this budget and ALL its data." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      {formState && renderForm()}
      
      {/* Header */}
      <div className="pt-8 px-6 pb-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden">
                         <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${userName}`} alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                     <div>
                         <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Hi, {userName}</h1>
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select Workspace</p>
                     </div>
                 </div>
                 {!formState && (
                    <button onClick={() => setIsEditingList(!isEditingList)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${isEditingList ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                        {isEditingList ? 'Done' : 'Edit'}
                    </button>
                 )}
            </div>
      </div>
      
      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {customContexts.map(ctx => {
             const IconObj = availableIcons.find(i => i.name === ctx.icon) || { icon: Folder };
             const Icon = IconObj.icon;
             
             return (
                <div key={ctx.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group active:scale-[0.99] transition-transform shadow-sm hover:border-slate-300 dark:hover:border-slate-700">
                    <button onClick={() => !isEditingList && onSelect(ctx.id)} className="flex items-center gap-4 flex-1 text-left">
                        <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300`}>
                            <Icon size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{ctx.name}</h4>
                            <p className="text-xs text-slate-500 font-medium capitalize">{ctx.timeline} Plan</p>
                        </div>
                    </button>
                    
                    {isEditingList ? (
                        <div className="flex gap-2">
                            <button onClick={() => openForm('edit', ctx)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 transition-colors">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => setDeleteId(ctx.id)} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : (
                         <button onClick={() => onSelect(ctx.id)} className="p-2 text-slate-300 group-hover:text-emerald-500 transition-colors">
                             <ChevronRight size={20}/>
                         </button>
                    )}
                </div>
             );
        })}

        {!formState && !isEditingList && (
            <button onClick={() => openForm('create')} className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all">
                <Plus size={24}/>
                <span className="font-bold text-sm">Add Budget</span>
            </button>
        )}
      </div>
    </div>
  );
};

interface IconPickerProps {
    onSelect: (iconName: string) => void;
    onClose: () => void;
}
const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const filteredIcons = useMemo(() => {
        return availableIcons.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }, [search]);

    return (
        <div className="fixed inset-0 z-[160] bg-white dark:bg-slate-900 p-6 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Select Icon</h4>
                <button type="button" onClick={onClose} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><X size={20}/></button>
            </div>
            <div className="relative mb-4">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                    type="text"
                    placeholder="Search icons..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full p-3 pl-10 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                />
            </div>
            <div className="flex-1 grid grid-cols-4 gap-3 overflow-y-auto scrollbar-hide">
                {filteredIcons.map(item => {
                    const Icon = item.icon;
                    return (
                        <button type="button" key={item.name} onClick={() => onSelect(item.name)} className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors group">
                            <Icon size={24}/>
                            <span className="text-[10px] font-bold mt-1 group-hover:text-white dark:group-hover:text-slate-900">{item.name}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};
