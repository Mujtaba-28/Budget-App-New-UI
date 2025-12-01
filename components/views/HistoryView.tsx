
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';
const { Filter, ArrowUp, ArrowDown, Search, X } = Lucide;
import { Transaction } from '../../types';
import { TransactionItem } from '../TransactionItem';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as Window from 'react-window';
const { FixedSizeList: List } = Window;

interface HistoryViewProps {
  onEditTx: (tx: Transaction) => void;
  isPrivacyMode: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onEditTx, isPrivacyMode }) => {
    const { transactions } = useFinance();
    const { currency } = useTheme();
    const [showFilters, setShowFilters] = useState(false);
    
    // Filter State
    const [filterType, setFilterType] = useState('all'); 
    const [sortOrder, setSortOrder] = useState('newest'); 
    const [timeline, setTimeline] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
    // Layout State for Virtualization
    const containerRef = useRef<HTMLDivElement>(null);
    const [listHeight, setListHeight] = useState(500);

    const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

    // Measure height for virtual list
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setListHeight(entry.contentRect.height);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Filtering Logic
    const displayTransactions = useMemo(() => {
        let data = [...transactions];
        
        // Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(t => 
                t.title.toLowerCase().includes(query) || 
                t.category.toLowerCase().includes(query) ||
                t.amount.toString().includes(query)
            );
        }

        // Type
        if (filterType !== 'all') data = data.filter(t => t.type === filterType);
        
        // Time
        const now = new Date();
        if (timeline === 'today') {
            data = data.filter(t => new Date(t.date).toDateString() === now.toDateString());
        } else if (timeline === 'week') { 
            const d = new Date(); d.setDate(d.getDate()-7); 
            data = data.filter(t => new Date(t.date) >= d); 
        } else if (timeline === 'month') { 
            const d = new Date(); d.setMonth(d.getMonth()-1); 
            data = data.filter(t => new Date(t.date) >= d); 
        }

        // Category
        if (selectedCategories.length > 0) {
            data = data.filter(t => selectedCategories.includes(t.category));
        }

        // Sort
        data.sort((a,b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (sortOrder === 'newest') return dateB - dateA;
            if (sortOrder === 'oldest') return dateA - dateB;
            if (sortOrder === 'high') return b.amount - a.amount;
            if (sortOrder === 'low') return a.amount - b.amount;
            return 0;
        });

        return data;
    }, [transactions, filterType, sortOrder, timeline, selectedCategories, searchQuery]);

    const toggleCategory = (catName: string) => {
        setSelectedCategories(prev => 
            prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
        );
    };
    
    const clearFilters = () => {
        setFilterType('all');
        setTimeline('all');
        setSelectedCategories([]);
        setSearchQuery('');
        setSortOrder('newest');
    };

    const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
        const tx = displayTransactions[index];
        return (
            <div style={{ ...style, paddingBottom: 8, paddingRight: 4 }}>
                <TransactionItem tx={tx} onClick={onEditTx} currency={currency} isPrivacyMode={isPrivacyMode} />
            </div>
        );
    };

    return (
        <div className="animate-in fade-in duration-300 h-full flex flex-col max-w-md mx-auto">
            {/* Search & Filter Header */}
            <div className="shrink-0 space-y-3 mb-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-[#0a3831] h-12 pl-10 pr-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 text-sm font-bold text-emerald-950 dark:text-emerald-50 focus:ring-2 focus:ring-emerald-500/50 outline-none placeholder:font-normal placeholder:text-slate-400 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 dark:bg-black/20 rounded-full text-slate-400">
                                <X size={12}/>
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`h-12 w-12 flex items-center justify-center rounded-2xl border transition-colors ${showFilters || selectedCategories.length > 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-[#0a3831] border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400'}`}
                    >
                        <Filter size={20}/>
                    </button>
                </div>

                {/* Quick Filters */}
                {showFilters && (
                    <div className="bg-white dark:bg-[#0a3831] p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Filters</h4>
                            <button onClick={clearFilters} className="text-xs font-bold text-emerald-600 hover:underline">Reset</button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Type */}
                            <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl">
                                {['all', 'expense', 'income'].map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => setFilterType(t)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filterType === t ? 'bg-white dark:bg-emerald-600 text-emerald-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Timeline */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                {['all', 'today', 'week', 'month'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setTimeline(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap border ${timeline === t ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'border-transparent bg-slate-50 dark:bg-black/20 text-slate-500'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Sort */}
                            <div className="flex gap-2">
                                <button onClick={() => setSortOrder('newest')} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${sortOrder === 'newest' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>Newest</button>
                                <button onClick={() => setSortOrder('oldest')} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${sortOrder === 'oldest' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>Oldest</button>
                                <button onClick={() => setSortOrder('high')} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${sortOrder === 'high' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>Highest</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction List */}
            <div className="flex-1 min-h-0" ref={containerRef}>
                {displayTransactions.length > 0 ? (
                    <List
                        height={listHeight}
                        itemCount={displayTransactions.length}
                        itemSize={88} // Height of TransactionItem + padding
                        width="100%"
                    >
                        {Row}
                    </List>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 pb-20">
                        <Search size={48} className="text-slate-300 mb-2"/>
                        <p className="font-bold text-slate-400">No transactions found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
