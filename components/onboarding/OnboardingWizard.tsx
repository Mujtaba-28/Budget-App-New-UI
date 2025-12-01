
import React, { useState, useEffect } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as Lucide from 'lucide-react';
const { ChevronRight, Check, Sparkles, Shield, Camera, LayoutGrid, User, ArrowRight, ArrowLeft, Loader2, Trash2, Database } = Lucide;
import { triggerHaptic } from '../../utils';
import { INITIAL_SUBSCRIPTIONS, INITIAL_GOALS, INITIAL_DEBTS } from '../../constants';
import { clearAllStores } from '../../utils/db';

export const OnboardingWizard: React.FC = () => {
    const { completeOnboarding, addContext, updateBudget, addTransaction, addSubscription, addGoal, addDebt } = useFinance();
    const { setCurrency, currency } = useTheme();
    
    const [step, setStep] = useState(1);
    
    // Data State
    const [name, setName] = useState('');
    const [setupMode, setSetupMode] = useState<'fresh' | 'demo'>('fresh');
    
    // Button Launch State
    const [launchState, setLaunchState] = useState<'idle' | 'loading' | 'success'>('idle');

    const currencies = [ '₹', '$', '€', '£', 'AED', '¥' ];

    useEffect(() => {
        if (step === 3) {
            document.getElementById('onboarding-name-input')?.focus();
        }
    }, [step]);

    const handleNext = () => {
        if (step === 3 && !name.trim()) return;
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleLaunch = async () => {
        if (launchState !== 'idle') return;

        setLaunchState('loading');
        triggerHaptic(20);
        
        try {
            if (setupMode === 'demo') {
                await clearAllStores();

                const contextId = addContext({
                    name: 'Personal',
                    budgetAmount: 60000,
                    icon: 'User',
                    timeline: 'monthly',
                    type: 'personal'
                });

                if (contextId) {
                    const today = new Date();
                    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
                    
                    for (let i = 0; i < 6; i++) {
                        const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
                        
                        const budget = 60000 + randomInt(-2000, 5000);
                        updateBudget(budget, monthKey, undefined, contextId);

                        // Salary
                        await addTransaction({
                            id: Date.now() + Math.random(),
                            title: 'Salary',
                            amount: 55000 + randomInt(0, 5000),
                            type: 'income',
                            category: 'Salary',
                            date: new Date(targetDate.getFullYear(), targetDate.getMonth(), randomInt(1, 3)).toISOString(),
                            context: contextId
                        });

                        // Rent
                        await addTransaction({
                            id: Date.now() + Math.random(),
                            title: 'Monthly Rent',
                            amount: 18000,
                            type: 'expense',
                            category: 'Bills',
                            date: new Date(targetDate.getFullYear(), targetDate.getMonth(), randomInt(2, 3)).toISOString(),
                            context: contextId
                        });

                        // Random Expenses
                        for (let k = 0; k < 8; k++) {
                            await addTransaction({
                                id: Date.now() + Math.random(),
                                title: ['Grocery', 'Uber', 'Dinner', 'Coffee', 'Shopping'][randomInt(0, 4)],
                                amount: randomInt(100, 2000),
                                type: 'expense',
                                category: ['Groceries', 'Transport', 'Food', 'Food', 'Fun'][randomInt(0, 4)],
                                date: new Date(targetDate.getFullYear(), targetDate.getMonth(), randomInt(1, 28)).toISOString(),
                                context: contextId
                            });
                        }
                    }

                    updateBudget(60000, 'default', undefined, contextId);

                    for (const sub of INITIAL_SUBSCRIPTIONS) {
                        const subDate = new Date(sub.nextBillingDate);
                        const newDate = new Date(today.getFullYear(), today.getMonth(), Math.min(subDate.getDate(), 28));
                        addSubscription({ ...sub, context: contextId, nextBillingDate: newDate.toISOString() });
                    }
                    for (const goal of INITIAL_GOALS) addGoal({ ...goal, context: contextId });
                    for (const debt of INITIAL_DEBTS) addDebt({ ...debt, context: contextId });
                }
                
                setTimeout(() => {
                    setLaunchState('success');
                    triggerHaptic([100, 50, 100]);
                    setTimeout(() => completeOnboarding(name, false), 700);
                }, 1000);

            } else {
                setTimeout(() => {
                    setLaunchState('success');
                    triggerHaptic([100, 50, 100]);
                    setTimeout(() => completeOnboarding(name, true), 700);
                }, 1000);
            }
        } catch (e) {
            console.error("Launch Failed", e);
            alert("Something went wrong. Starting fresh.");
            completeOnboarding(name, true);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden min-h-[500px] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    {step > 1 ? (
                        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    ) : <div className="w-10"></div>}
                    
                    <div className="flex gap-2">
                         {[1,2,3,4].map(i => (
                             <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-slate-900 dark:bg-white' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
                         ))}
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[20px] flex items-center justify-center text-white dark:text-slate-900 mb-6 shadow-xl shadow-slate-200 dark:shadow-none">
                            <Sparkles size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Emerald</h1>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8 text-sm font-medium">
                            Professional finance tracking.<br/>Private. Fast. Offline.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 w-full mb-8">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                                <Shield className="w-6 h-6 text-emerald-500 mb-2"/>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">Local First</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                                <LayoutGrid className="w-6 h-6 text-indigo-500 mb-2"/>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">Analytics</div>
                            </div>
                        </div>

                        <button onClick={handleNext} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            Get Started
                        </button>
                    </div>
                )}

                {/* Step 2: Features */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Features</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">Built for speed and privacy.</p>
                        
                        <div className="space-y-4 flex-1">
                            {[
                                { icon: Camera, title: "Receipt Scan", desc: "Extract details instantly from photos.", color: "text-blue-500" },
                                { icon: Database, title: "Offline Database", desc: "No servers. Your data is yours.", color: "text-purple-500" },
                                { icon: User, title: "Multi-Budget", desc: "Separate Personal & Business.", color: "text-orange-500" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm ${item.color}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={handleNext} className="w-full mt-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all">
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 3: Identity */}
                {step === 3 && (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profile</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">Personalize your workspace.</p>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Your Name</label>
                                <input 
                                    id="onboarding-name-input"
                                    type="text" 
                                    placeholder="Enter your name" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl font-bold text-lg outline-none text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Currency</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {currencies.map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setCurrency(c)}
                                            className={`p-3 rounded-xl font-bold text-lg border transition-all ${currency === c ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button onClick={handleNext} disabled={!name.trim()} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            Next Step
                        </button>
                    </div>
                )}

                {/* Step 4: Data Setup */}
                {step === 4 && (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Setup</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">How should we start?</p>

                        <div className="space-y-4 flex-1">
                            <button 
                                onClick={() => setSetupMode('fresh')}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${setupMode === 'fresh' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-transparent hover:border-slate-300'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${setupMode === 'fresh' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                        <Trash2 size={20}/>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Fresh Start</h4>
                                        <p className="text-xs text-slate-500">Empty database</p>
                                    </div>
                                </div>
                                {setupMode === 'fresh' && <Check size={20} className="text-emerald-500"/>}
                            </button>

                            <button 
                                onClick={() => setSetupMode('demo')}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${setupMode === 'demo' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700 bg-transparent hover:border-slate-300'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${setupMode === 'demo' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                        <Database size={20}/>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Load Demo Data</h4>
                                        <p className="text-xs text-slate-500">Sample history</p>
                                    </div>
                                </div>
                                {setupMode === 'demo' && <Check size={20} className="text-indigo-500"/>}
                            </button>
                        </div>

                        <button 
                            onClick={handleLaunch} 
                            disabled={launchState !== 'idle'}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {launchState === 'idle' && "Launch App"}
                            {launchState === 'loading' && <Loader2 size={18} className="animate-spin"/>}
                            {launchState === 'success' && <Check size={18} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
