
import React, { useState, useEffect, useRef, memo } from 'react';
import * as Lucide from 'lucide-react';
const { ChevronLeft, ChevronRight, AlertTriangle, ThumbsUp, Settings2, Eye, EyeOff, ArrowUp, ArrowDown, Loader2, ArrowUpRight } = Lucide;
import { DashboardCard } from '../../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants';
import { formatMoney } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createAnalyticsWorker } from '../../utils/worker';

interface StatsViewProps {
  isPrivacyMode: boolean;
  currentDate: Date;
  changeMonth: (offset: number) => void;
}

// Memoized Chart Component
const SpendingChart = memo(({ data, width, height, isPrivacyMode, viewType, currentBudget }: any) => {
    const PADDING_TOP = 20;
    const PADDING_BOTTOM = 30; 
    const PADDING_LEFT = 40;   
    const PADDING_RIGHT = 15;
    const GRAPH_WIDTH = width - PADDING_LEFT - PADDING_RIGHT;
    const GRAPH_HEIGHT = height - PADDING_TOP - PADDING_BOTTOM;

    const { cumulativeSpending, predictedTotal, isOverBudget, daysInMonth } = data;

    let maxY = Math.max(predictedTotal, 10000); 
    if (viewType === 'expense') maxY = Math.max(maxY, currentBudget);
    maxY = maxY * 1.1; 

    const scaleX = GRAPH_WIDTH / (daysInMonth - 1 || 1); 
    const scaleY = GRAPH_HEIGHT / (maxY > 0 ? maxY : 1); 
    const zeroY = height - PADDING_BOTTOM;

    const getX = (index: number) => PADDING_LEFT + (index * scaleX);
    const getY = (val: number) => zeroY - (val * scaleY);

    const polylinePoints = cumulativeSpending.map((val: number, i: number) => `${getX(i)},${getY(val)}`).join(' ');
    const areaPath = cumulativeSpending.length > 0 
        ? `M ${getX(0)},${zeroY} ${cumulativeSpending.map((val: number, i: number) => `L ${getX(i)},${getY(val)}`).join(' ')} L ${getX(cumulativeSpending.length - 1)},${zeroY} Z`
        : '';

    const limitY = getY(currentBudget);
    
    // Clean, professional colors
    const chartTheme = isOverBudget && viewType === 'expense'
        ? { stroke: '#f43f5e', fill: 'url(#gradientRed)', point: '#f43f5e' } 
        : { stroke: '#10b981', fill: 'url(#gradientGreen)', point: '#10b981' }; 

    const yTicks = [0, maxY * 0.5, maxY];
    const formatYLabel = (val: number) => {
        if (val >= 100000) return (val / 100000).toFixed(1).replace('.0','') + 'L'; 
        if (val >= 1000) return (val / 1000).toFixed(1).replace('.0','') + 'k';
        return val.toFixed(0);
    };

    const hasPoints = cumulativeSpending.length > 0;
    const isSinglePoint = cumulativeSpending.length === 1;

    return (
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="gradientGreen" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="gradientRed" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0"/>
                </linearGradient>
            </defs>
            {yTicks.map((val, i) => {
                const y = getY(val);
                if (isNaN(y)) return null;
                return (
                    <g key={`y-${i}`}>
                        <line x1={PADDING_LEFT} y1={y} x2={width - PADDING_RIGHT} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" className="dark:stroke-slate-800"/>
                        <text x={PADDING_LEFT - 8} y={y + 3} fontSize="10" fill="#94a3b8" fontWeight="600" textAnchor="end" className="select-none">{formatYLabel(val)}</text>
                    </g>
                );
            })}
            {viewType === 'expense' && (<line x1={PADDING_LEFT} y1={limitY} x2={width - PADDING_RIGHT} y2={limitY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />)}
            
            {hasPoints && <path d={areaPath} fill={chartTheme.fill} />}
            {hasPoints && <polyline points={polylinePoints} fill="none" stroke={chartTheme.stroke} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>}
            
            {isSinglePoint && (
                <>
                    <circle cx={getX(0)} cy={getY(cumulativeSpending[0])} r="4" fill={chartTheme.point} />
                    <circle cx={getX(0)} cy={getY(cumulativeSpending[0])} r="8" fill={chartTheme.point} opacity="0.3" className="animate-ping"/>
                </>
            )}
        </svg>
    );
});

// Card Component
const CardBase: React.FC<{ children: React.ReactNode, title?: string, className?: string }> = ({ children, title, className = "" }) => (
    <div className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 ${className}`}>
        {title && <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm tracking-tight flex items-center gap-2 before:w-1 before:h-4 before:bg-emerald-500 before:rounded-full before:block">{title}</h3>}
        {children}
    </div>
);

export const StatsView: React.FC<StatsViewProps> = ({ isPrivacyMode, currentDate, changeMonth }) => {
    const { transactions, budgets, activeContext } = useFinance();
    const { currency } = useTheme();
    const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
    const [isEditingLayout, setIsEditingLayout] = useState(false);
    
    // Worker State
    const [stats, setStats] = useState<any>(null);
    const workerRef = useRef<Worker | null>(null);

    // Default Layout State
    const [cardOrder, setCardOrder] = useState<DashboardCard[]>([
        { id: 'prediction', label: 'Forecast', visible: true },
        { id: 'trend', label: 'Trend', visible: true },
        { id: 'cashflow', label: 'Cash Flow', visible: true },
        { id: 'cat_budgets', label: 'Limits', visible: true },
        { id: 'breakdown', label: 'Breakdown', visible: true },
        { id: 'averages', label: 'Averages', visible: true },
    ]);

    useEffect(() => {
        workerRef.current = createAnalyticsWorker();
        workerRef.current.onmessage = (e) => {
            if (e.data.error) {
                console.error("Worker Error", e.data.error);
            } else {
                setStats(e.data);
            }
        };
        return () => workerRef.current?.terminate();
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            const sanitizeCats = (cats: any[]) => cats.map(({ icon, ...rest }) => rest);
            const sanitizeTxs = (txs: any[]) => txs.map(({ icon, ...rest }) => rest);

            workerRef.current.postMessage({
                transactions: sanitizeTxs(transactions),
                currentDateStr: currentDate.toISOString(),
                budgets,
                activeContext,
                viewType,
                EXPENSE_CATEGORIES: sanitizeCats(EXPENSE_CATEGORIES),
                INCOME_CATEGORIES: sanitizeCats(INCOME_CATEGORIES)
            });
        }
    }, [transactions, currentDate, budgets, activeContext, viewType]);

    // Dashboard Customization Handlers
    const toggleCardVisibility = (id: string) => {
        setCardOrder(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    };

    const moveCard = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === cardOrder.length - 1) return;
        
        const newOrder = [...cardOrder];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
        setCardOrder(newOrder);
    };

    const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="animate-spin text-emerald-500 mb-2" size={32}/>
            </div>
        );
    }

    const { 
        activeTotal, predictedTotal, isOverBudget, 
        currentDailyAverage, categoryData, maxCategoryVal, totalForDonut, 
        currentBudget, daysInMonth, cashFlow
    } = stats;
    
    const daysLeft = daysInMonth - new Date().getDate();
    const remainingMonthBudget = currentBudget - activeTotal;
    const recommendedDailyAverage = daysLeft > 0 && remainingMonthBudget > 0 ? remainingMonthBudget / daysLeft : 0;
    
    // Gradient for Donut Chart - Professional Colors
    let currentDeg = 0;
    const gradientString = categoryData.map((cat: any) => {
        const deg = (totalForDonut > 0) ? (cat.amount / totalForDonut) * 360 : 0;
        const color = cat.code;
        const str = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return str;
    }).join(', ');
    const finalGradient = gradientString || '#e2e8f0 0deg 360deg'; 

    const renderDashboardCard = (card: DashboardCard) => {
        if (!card.visible) return null;
        
        if (card.id === 'prediction') {
            return (
                <div key={card.id} className={`p-5 rounded-3xl shadow-sm border border-transparent text-white flex items-center gap-4 relative overflow-hidden ${isOverBudget ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 'bg-gradient-to-br from-slate-800 to-black dark:from-emerald-600 dark:to-emerald-800'}`}>
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md relative z-10">
                        {isOverBudget ? <AlertTriangle size={24} /> : <ThumbsUp size={24} />}
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-lg leading-none mb-1">{isOverBudget ? 'Over Budget' : 'On Track'}</h4>
                        <p className="text-xs opacity-80 font-medium">
                            Forecast: {formatMoney(predictedTotal, currency, isPrivacyMode)}
                        </p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 scale-150 transform translate-x-4 translate-y-4 pointer-events-none">
                         {isOverBudget ? <AlertTriangle size={120} /> : <ThumbsUp size={120} />}
                    </div>
                </div>
            );
        } else if (card.id === 'cashflow') {
            const maxCF = Math.max(...cashFlow.map((c: any) => Math.max(c.income, c.expense)), 100);
            return (
                <CardBase key={card.id} title="6-Month Flow">
                     <div className="flex justify-between items-end h-32 gap-3 pt-2">
                         {cashFlow.map((cf: any, i: number) => (
                             <div key={i} className="flex flex-col items-center flex-1 gap-2 h-full justify-end group">
                                 <div className="flex gap-1 items-end w-full justify-center h-full relative">
                                     <div className="w-2.5 bg-emerald-500/80 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-500" style={{ height: `${(cf.income / maxCF) * 100}%` }}></div>
                                     <div className="w-2.5 bg-rose-500/80 rounded-t-sm transition-all duration-500 group-hover:bg-rose-500" style={{ height: `${(cf.expense / maxCF) * 100}%` }}></div>
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{cf.month}</span>
                             </div>
                         ))}
                     </div>
                </CardBase>
            );
        } else if (card.id === 'cat_budgets' && viewType === 'expense') {
            return (
                <CardBase key={card.id} title="Spending Limits">
                    <div className="space-y-5">
                        {categoryData.filter((c: any) => c.budget > 0).map((cat: any) => {
                             const percent = (cat.amount / cat.budget) * 100;
                             const isOver = percent > 100;
                             
                             return (
                                 <div key={cat.id} className="group">
                                     <div className="flex justify-between text-xs font-bold mb-2">
                                         <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.code}}></div>
                                             {cat.name}
                                         </span>
                                         <span className={isOver ? 'text-rose-500' : 'text-slate-500'}>
                                             {Math.round(percent)}%
                                         </span>
                                     </div>
                                     <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                         <div 
                                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : 'bg-slate-900 dark:bg-emerald-500'}`} 
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                         ></div>
                                     </div>
                                     <div className="flex justify-between mt-1 text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <span>{formatMoney(cat.amount, currency, isPrivacyMode)} spent</span>
                                         <span>{formatMoney(cat.budget, currency, isPrivacyMode)} limit</span>
                                     </div>
                                 </div>
                             )
                        })}
                        {categoryData.filter((c: any) => c.budget > 0).length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                <p className="text-xs text-slate-400 font-bold">No limits set for this month.</p>
                            </div>
                        )}
                    </div>
                </CardBase>
            );
        } else if (card.id === 'trend') {
            return (
                <CardBase key={card.id} title={`${viewType === 'expense' ? 'Spending' : 'Income'} Trend`}>
                    <div className="h-48 relative w-full overflow-hidden">
                        <SpendingChart 
                            data={stats} 
                            width={350} 
                            height={190} 
                            isPrivacyMode={isPrivacyMode} 
                            viewType={viewType}
                            currentBudget={currentBudget}
                        />
                    </div>
                </CardBase>
            );
        } else if (card.id === 'averages') {
            return (
                <div key={card.id} className="grid grid-cols-2 gap-4">
                    <CardBase className="!p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Average</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{formatMoney(Math.round(currentDailyAverage), currency, isPrivacyMode)}</p>
                    </CardBase>
                    <CardBase className="!p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{viewType === 'expense' ? 'Safe Daily' : 'Projected'}</p>
                        <p className={`text-xl font-bold ${viewType === 'expense' && recommendedDailyAverage < currentDailyAverage ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {viewType === 'expense' ? formatMoney(Math.round(recommendedDailyAverage), currency, isPrivacyMode) : formatMoney(Math.round(predictedTotal), currency, isPrivacyMode)}
                        </p>
                    </CardBase>
                </div>
            );
        } else if (card.id === 'breakdown') {
            return (
                <CardBase key={card.id} title="Category Breakdown">
                    <div className="flex justify-center mb-8">
                            {totalForDonut > 0 ? (
                            <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                                    style={{ background: `conic-gradient(${finalGradient})` }}>
                                <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center z-10 shadow-lg border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{viewType}</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(totalForDonut, currency, isPrivacyMode)}</span>
                                </div>
                            </div>
                        ) : (
                                <div className="w-40 h-40 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold border-2 border-slate-100 dark:border-slate-700 border-dashed">No Data</div>
                        )}
                    </div>
                    <div className="space-y-4">
                        {categoryData.length > 0 ? categoryData.slice(0, 5).map((cat: any) => {
                            const percent = (cat.amount / maxCategoryVal) * 100;
                            return (
                                <div key={cat.id} className="flex items-center gap-4 text-xs">
                                    <div className="w-24 truncate font-bold text-slate-600 dark:text-slate-400">{cat.name}</div>
                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: cat.code }}></div>
                                    </div>
                                    <div className="w-16 text-right font-bold text-slate-900 dark:text-white">{formatMoney(cat.amount, currency, isPrivacyMode)}</div>
                                </div>
                            )
                        }) : <p className="text-center text-slate-400 text-xs">No transactions.</p>}
                    </div>
                </CardBase>
            );
        }
    };

    if (isEditingLayout) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customize</h2>
                    <button onClick={() => setIsEditingLayout(false)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity">
                        Done
                    </button>
                </div>
                
                <div className="space-y-3">
                    {cardOrder.map((card, index) => (
                        <div key={card.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div className="flex flex-col gap-1 text-slate-400">
                                <button onClick={() => moveCard(index, 'up')} disabled={index === 0} className="hover:text-emerald-600 p-1 rounded hover:bg-slate-50"><ArrowUp size={16}/></button>
                                <button onClick={() => moveCard(index, 'down')} disabled={index === cardOrder.length - 1} className="hover:text-emerald-600 p-1 rounded hover:bg-slate-50"><ArrowDown size={16}/></button>
                            </div>
                            <div className="flex-1 font-bold text-slate-700 dark:text-slate-300 text-sm">{card.label}</div>
                            <button 
                                onClick={() => toggleCardVisibility(card.id)}
                                className={`p-2 rounded-xl transition-colors ${card.visible ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                            >
                                {card.visible ? <Eye size={18}/> : <EyeOff size={18}/>}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-4 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                 <button onClick={() => changeMonth(-1)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:scale-105 transition-transform"><ChevronLeft size={18}/></button>
                 <span className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">{currentMonthName}</span>
                 <button onClick={() => changeMonth(1)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:scale-105 transition-transform"><ChevronRight size={18}/></button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mx-1">
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex shadow-inner">
                    <button onClick={() => setViewType('expense')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${viewType === 'expense' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Expenses</button>
                    <button onClick={() => setViewType('income')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${viewType === 'income' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Income</button>
                </div>
                <button onClick={() => setIsEditingLayout(true)} className="px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"><Settings2 size={18} /></button>
            </div>

            <div className="space-y-4 mx-1">
                {cardOrder.map((card) => renderDashboardCard(card))}
            </div>
        </div>
    )
};
