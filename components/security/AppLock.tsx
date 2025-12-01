
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
const { Lock, Delete, Unlock, ScanFace, Fingerprint } = Lucide;
import { useFinance } from '../../contexts/FinanceContext';
import { authenticateBiometric, isBiometricAvailable } from '../../utils/security';

interface AppLockProps {
    savedPin: string;
    onUnlock: () => void;
}

export const AppLock: React.FC<AppLockProps> = ({ savedPin, onUnlock }) => {
    const { resetData } = useFinance();
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const [canUseBio, setCanUseBio] = useState(false);

    useEffect(() => {
        const checkBio = async () => {
            const available = await isBiometricAvailable();
            const enabled = localStorage.getItem('emerald_biometric_active') === 'true';
            setCanUseBio(available && enabled);
            
            // Auto-trigger bio on load if enabled
            if (available && enabled) {
               handleBiometricAuth();
            }
        };
        checkBio();
    }, []);

    useEffect(() => {
        if (input.length === 4) {
            if (input === savedPin) {
                onUnlock();
            } else {
                setError(true);
                setTimeout(() => {
                    setInput('');
                    setError(false);
                }, 500);
            }
        }
    }, [input, savedPin, onUnlock]);

    const handlePress = (num: string) => {
        if (input.length < 4) {
            setInput(prev => prev + num);
            setError(false);
        }
    };

    const handleBackspace = () => {
        setInput(prev => prev.slice(0, -1));
    };
    
    const handleForgotPin = () => {
        if (window.confirm("Forgot PIN? The only way to access the app is to RESET all data. This is a security feature. Are you sure you want to Wipe Data & Reset?")) {
            resetData();
        }
    };

    const handleBiometricAuth = async () => {
        const success = await authenticateBiometric();
        if (success) {
            onUnlock();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-emerald-950 flex flex-col items-center justify-center p-6 text-white">
            <div className="mb-8 flex flex-col items-center animate-in zoom-in duration-500">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-all duration-300 ${error ? 'bg-rose-500 shadow-rose-500/50 translate-x-1' : 'bg-emerald-500 shadow-emerald-500/50'}`}>
                    {input.length === 4 && !error ? <Unlock size={40} className="text-white"/> : <Lock size={40} className="text-white"/>}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
                <p className="text-emerald-400/60 text-sm mt-1">Enter PIN or use Biometrics</p>
            </div>

            <div className="flex gap-4 mb-12">
                {[0, 1, 2, 3].map(i => (
                    <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${i < input.length ? (error ? 'bg-rose-500' : 'bg-emerald-400') : 'bg-white/10'}`}
                    ></div>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button 
                        key={num}
                        onClick={() => handlePress(num.toString())}
                        className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/20 active:bg-emerald-500/50 transition-colors flex items-center justify-center text-2xl font-bold"
                    >
                        {num}
                    </button>
                ))}
                
                <div className="w-20 h-20 flex items-center justify-center">
                     {canUseBio ? (
                         <button onClick={handleBiometricAuth} className="w-16 h-16 rounded-full flex items-center justify-center text-emerald-400 hover:bg-white/10 transition-colors">
                             <ScanFace size={32}/>
                         </button>
                     ) : (
                         <button onClick={handleForgotPin} className="text-[10px] font-bold text-rose-400 opacity-60 hover:opacity-100 uppercase">Forgot?</button>
                     )}
                </div>

                <button 
                    onClick={() => handlePress('0')}
                    className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/20 active:bg-emerald-500/50 transition-colors flex items-center justify-center text-2xl font-bold"
                >
                    0
                </button>
                <button 
                    onClick={handleBackspace}
                    className="w-20 h-20 rounded-full hover:bg-white/10 active:bg-rose-500/30 transition-colors flex items-center justify-center text-rose-400"
                >
                    <Delete size={28}/>
                </button>
            </div>
            
            {/* Fallback Forgot Button if Bio is shown above */}
            {canUseBio && (
                <button onClick={handleForgotPin} className="mt-8 text-[10px] font-bold text-rose-400 opacity-40 hover:opacity-100 uppercase">
                    Forgot PIN?
                </button>
            )}
        </div>
    );
};
