
import React, { useState, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';
const { X, Send, Sparkles, User, Bot, Loader2, AlertTriangle } = Lucide;
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { ChatMessage } from '../../types';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../constants';

interface AIChatModalProps { onClose: () => void; totalBudget: number; }

export const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, totalBudget }) => {
    const { addTransaction, addGoal, updateBudget, addSubscription } = useFinance();
    const { currency } = useTheme();
    const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', role: 'model', text: `Hi! I can help you track expenses or set goals. Try "Spent 500 on Food".`, timestamp: new Date() }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasApiKey = !!process.env.API_KEY;

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [messages]);

    const addTransactionTool: FunctionDeclaration = {
        name: 'addTransaction', description: 'Add transaction.', parameters: { type: Type.OBJECT, properties: { amount: { type: Type.NUMBER }, category: { type: Type.STRING }, title: { type: Type.STRING }, type: { type: Type.STRING, enum: ['income', 'expense'] } }, required: ['amount', 'category', 'type'] }
    };
    const addGoalTool: FunctionDeclaration = { name: 'addGoal', description: 'Create savings goal.', parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, targetAmount: { type: Type.NUMBER } }, required: ['name', 'targetAmount'] } };
    const updateBudgetTool: FunctionDeclaration = { name: 'updateBudget', description: 'Update budget.', parameters: { type: Type.OBJECT, properties: { amount: { type: Type.NUMBER } }, required: ['amount'] } };

    const handleSend = async () => {
        if (!input.trim() || !hasApiKey) return;
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `You are an AI financial assistant. Today is ${new Date().toISOString().split('T')[0]}. Currency: ${currency}. Categories: ${[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c=>c.name).join(', ')}.`;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                config: { systemInstruction: systemPrompt, tools: [{ functionDeclarations: [addTransactionTool, addGoalTool, updateBudgetTool] }] },
                contents: messages.concat(userMsg).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            });
            const call = response.functionCalls?.[0];

            if (call) {
                let resultText = "Done.";
                if (call.name === 'addTransaction') {
                    const args = call.args as any;
                    await addTransaction({ id: Date.now(), title: args.title || 'AI Entry', category: args.category, amount: args.amount, type: args.type, date: new Date().toISOString() });
                    resultText = `Added ${args.type}: ${currency}${args.amount} (${args.category}).`;
                } else if (call.name === 'addGoal') {
                    const args = call.args as any;
                    addGoal({ id: Date.now().toString(), name: args.name, targetAmount: args.targetAmount, currentAmount: 0, color: 'bg-emerald-500' });
                     resultText = `Created goal "${args.name}".`;
                } else if (call.name === 'updateBudget') {
                    updateBudget(call.args.amount as number, 'default');
                    resultText = `Budget updated.`;
                }
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: resultText, timestamp: new Date() }]);
            } else if (response.text) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text, timestamp: new Date() }]);
            }
        } catch (error) { setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error.", timestamp: new Date() }]); } finally { setIsLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 h-[80vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400"><Sparkles size={18}/></div>
                        <div><h3 className="font-bold text-slate-900 dark:text-white">Emerald AI</h3><p className="text-[10px] text-slate-500 font-medium">Smart Assistant</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} className="text-slate-500"/></button>
                </div>
                
                {!hasApiKey ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                         <AlertTriangle size={32} className="text-amber-500 mb-4"/>
                         <h3 className="font-bold text-slate-900 dark:text-white mb-2">AI Not Configured</h3>
                         <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-600 dark:text-slate-300 text-sm">Close</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-none dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && <Loader2 className="animate-spin text-slate-400 mx-auto"/>}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                                <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none text-sm font-medium focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600" />
                                <button type="submit" disabled={!input.trim() || isLoading} className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"><Send size={20} /></button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
