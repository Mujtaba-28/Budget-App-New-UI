
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
const { X, Moon, Sun, Lock, Unlock, HelpCircle, ScanFace } = Lucide;
import { useTheme } from '../../contexts/ThemeContext';
import { useFinance } from '../../contexts/FinanceContext';
import { registerBiometric, isBiometricAvailable } from '../../utils/security';

interface SettingsModalProps {
  onClose: () => void;
  onOpenTutorial: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenTutorial }) => {
    const { isDark, toggleTheme, currency, setCurrency } = useTheme();
    const { userName } = useFinance();
    const [hasPin, setHasPin] = useState(false);
    const [bioActive, setBioActive] = useState(false);
    const [bioAvailable, setBioAvailable] = useState(false);
    
    const [mode, setMode] = useState<'view' | 'set' | 'change' | 'remove'>('view');
    const [step, setStep] = useState<'verify' | 'new' | 'confirm'>('new');
    const [inputPin, setInputPin] = useState('');
    
    useEffect(() => {
        const storedPin = localStorage.getItem('emerald_pin');
        setHasPin(!!storedPin);
        setBioActive(localStorage.getItem('emerald_biometric_active') === 'true');
        isBiometricAvailable().then(setBioAvailable);
    }, []);
    
    const currencies = [ { symbol: '₹', name: 'INR' }, { symbol: '$', name: 'USD' }, { symbol: '€', name: 'EUR' }, { symbol: '£', name: 'GBP' } ];
    
    const handlePinInput = (num: string) => {
        if (inputPin.length < 4) setInputPin(prev => prev + num);
    };

    const processPinAction = () => {
        if (inputPin.length !== 4) return;
        const storedPin = localStorage.getItem('emerald_pin');

        if (mode === 'set') {
            localStorage.setItem('emerald_pin', inputPin);
            setHasPin(true);
            setMode('view');
        } else if (mode === 'change') {
            if (step === 'verify') {
                if (inputPin === storedPin) { setStep('new'); setInputPin(''); } 
                else { alert('Incorrect Old PIN'); setInputPin(''); }
            } else if (step === 'new') {
                localStorage.setItem('emerald_pin', inputPin);
                setMode('view');
            }
        } else if (mode === 'remove') {
             if (inputPin === storedPin) {
                 localStorage.removeItem('emerald_pin');
                 localStorage.removeItem('emerald_biometric_active');
                 setHasPin(false);
                 setBioActive(false);
                 setMode('view');
             } else { alert('Incorrect PIN'); setInputPin(''); }
        }
    };

    const toggleBiometric = async () => {
        if (!hasPin) { alert("Please set a PIN first."); return; }
        if (bioActive) {
            localStorage.removeItem('emerald_biometric_active');
            setBioActive(false);
        } else {
            const success = await registerBiometric(userName);
            if (success) setBioActive(true);
            else alert("Failed to register Biometrics.");
        }
    };

    const renderPinPad = (title: string, actionLabel: string) => (
        <div className="p-4 text-center animate-in zoom-in-95">
            <h4 className="font-bold mb-4 text-slate-900 dark:text-white">{title}</h4>
            <div className="flex justify-center gap-2 mb-6">
                {[0,1,2,3].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < inputPin.length ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4 max-w-[240px] mx-auto">
                {[1,2,3,4,5,6,7,8,9,0].map(n => (
                    <button key={n} onClick={() => handlePinInput(n.toString())} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:bg-slate-300 transition-colors">{n}</button>
                ))}
                <button onClick={() => { setMode('view'); setInputPin(''); setStep('new'); }} className="col-span-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">Cancel</button>
            </div>
            <button onClick={processPinAction} disabled={inputPin.length !== 4} className="w-full max-w-[240px] mx-auto p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold disabled:opacity-50">{actionLabel}</button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Tutorial */}
                    <button 
                        onClick={onOpenTutorial}
                        className="w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between group active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <HelpCircle size={20} className="text-indigo-500"/>
                            <span className="font-bold text-indigo-900 dark:text-indigo-100">App Guide & Tutorial</span>
                        </div>
                    </button>

                    {/* Preferences */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">Appearance</h4>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                {isDark ? <Moon size={20} className="text-indigo-400"/> : <Sun size={20} className="text-amber-500"/>}
                                <span className="font-bold text-slate-900 dark:text-white">Dark Mode</span>
                            </div>
                            <button onClick={toggleTheme} className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${isDark ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                                <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                            </button>
                        </div>
                    </div>

                    {/* Security */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">Security</h4>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                            {mode === 'view' && (
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {hasPin ? <Lock size={20} className="text-emerald-500"/> : <Unlock size={20} className="text-slate-400"/>}
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">App Lock</h4>
                                                <p className="text-xs text-slate-400">{hasPin ? 'PIN Active' : 'Not Set'}</p>
                                            </div>
                                        </div>
                                        {hasPin ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => { setMode('change'); setStep('verify'); setInputPin(''); }} className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600">Change</button>
                                                <button onClick={() => { setMode('remove'); setInputPin(''); }} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold">Remove</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setMode('set'); setInputPin(''); }} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold">Set PIN</button>
                                        )}
                                    </div>

                                    {hasPin && bioAvailable && (
                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <ScanFace size={20} className="text-slate-500"/>
                                                <span className="font-bold text-slate-900 dark:text-white text-sm">Biometrics</span>
                                            </div>
                                            <button onClick={toggleBiometric} className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${bioActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                                                <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {mode !== 'view' && renderPinPad(
                                mode === 'set' ? 'Set PIN' : mode === 'remove' ? 'Remove Lock' : step === 'verify' ? 'Verify Old PIN' : 'New PIN',
                                mode === 'set' ? 'Save' : mode === 'remove' ? 'Remove' : step === 'verify' ? 'Verify' : 'Update'
                            )}
                        </div>
                    </div>

                    {/* Currency */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">Currency</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {currencies.map(c => (
                                <button key={c.name} onClick={() => setCurrency(c.symbol)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currency === c.symbol ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-400'}`}>
                                    <span className="text-xl font-bold">{c.symbol}</span>
                                    <span className="text-[10px] font-bold opacity-80">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};
