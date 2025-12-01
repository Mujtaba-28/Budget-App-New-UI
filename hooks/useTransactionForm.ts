
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, TransactionSplit } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { fileToGenerativePart, getExchangeRate, compressImage } from '../utils';
import { getAttachment } from '../utils/db';
import { z } from 'zod';

// Define Validation Schemas
const AiResponseSchema = z.object({
    amount: z.number().nullable().optional(),
    merchant: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), // YYYY-MM-DD
    type: z.enum(["income", "expense"]).nullable().optional()
});

export const useTransactionForm = (
    initialData: Transaction | null, 
    currency: string,
    onSave: (tx: Transaction) => void
) => {
    
    // Core State
    const [amount, setAmount] = useState(initialData ? Math.abs(initialData.amount).toString() : '');
    const [title, setTitle] = useState(initialData ? initialData.title : '');
    const [type, setType] = useState<TransactionType>(initialData ? initialData.type : 'expense');
    const [date, setDate] = useState(() => {
        try {
            return initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        } catch(e) { return new Date().toISOString().split('T')[0]; }
    });
    
    // Category State
    const currentCategoryList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const [category, setCategory] = useState(() => {
        if (initialData) {
            const found = currentCategoryList.find(c => c.name === initialData.category);
            if(found) return found;
        }
        return currentCategoryList[0];
    });

    // Multi-Currency State
    const [selectedCurrency, setSelectedCurrency] = useState(initialData?.originalCurrency || currency);
    const [originalAmount, setOriginalAmount] = useState(initialData?.originalAmount?.toString() || '');
    
    const currencyCodes: Record<string, string> = { '₹': 'INR', '$': 'USD', '€': 'EUR', '£': 'GBP', 'AED': 'AED', '¥': 'JPY' };

    // Split State
    const [isSplitMode, setIsSplitMode] = useState(!!initialData?.splits);
    const [splits, setSplits] = useState<TransactionSplit[]>(initialData?.splits || []);

    // Attachment State
    const [attachment, setAttachment] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Initial Load Effects
    useEffect(() => {
        if (initialData?.id && initialData.hasAttachment) {
            getAttachment(initialData.id).then(data => { if(data) setAttachment(data); });
        }
    }, [initialData]);

    // Category Sync
    useEffect(() => {
        const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        const isValid = list.some(c => c.id === category.id);
        if (!isValid && !isSplitMode) setCategory(list[0]);
    }, [type, isSplitMode]);

    // Split Sync
    useEffect(() => {
        if (isSplitMode && splits.length === 0) {
            setSplits([
                { category: currentCategoryList[0].name, amount: 0 },
                { category: currentCategoryList[1].name, amount: 0 }
            ]);
        }
    }, [isSplitMode]);

    // Currency Conversion
    useEffect(() => {
        if (selectedCurrency !== currency) {
            if(originalAmount) {
                const rate = getExchangeRate(currencyCodes[selectedCurrency] || 'USD', currencyCodes[currency] || 'INR');
                setAmount((parseFloat(originalAmount) * rate).toFixed(2));
            }
        } else {
            if (originalAmount) {
                setAmount(originalAmount);
                setOriginalAmount('');
            }
        }
    }, [selectedCurrency, originalAmount]);

    // --- ACTIONS ---

    const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressed = await compressImage(e.target.files[0]);
                setAttachment(compressed);
            } catch (e) { alert("Failed to process image"); }
        }
        e.target.value = '';
    };

    const analyzeReceipt = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = await fileToGenerativePart(file);
            
            // Corrected Payload Structure for v1 SDK
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: 'user',
                        parts: [
                            imagePart, // Passed as { inlineData: {...} } directly
                            { text: `Analyze this receipt. Extract Merchant, Total Amount, Date (YYYY-MM-DD), and Category. Return JSON.` }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            amount: { type: Type.NUMBER },
                            merchant: { type: Type.STRING },
                            category: { type: Type.STRING },
                            date: { type: Type.STRING }
                        }
                    }
                }
            });

            if (response.text) {
                const rawData = JSON.parse(response.text.replace(/```json|```/g, '').trim());
                
                // Validate with Zod
                const parseResult = AiResponseSchema.safeParse(rawData);
                
                if (!parseResult.success) {
                    console.error("AI Validation Failed", parseResult.error);
                    alert("AI could not confidently extract details. Please enter manually.");
                    return;
                }
                
                const data = parseResult.data;

                if (data.amount) {
                     if (selectedCurrency === currency) setAmount(data.amount.toString());
                     else {
                         setOriginalAmount(data.amount.toString());
                         const rate = getExchangeRate(currencyCodes[selectedCurrency] || 'USD', currencyCodes[currency] || 'INR');
                         setAmount((data.amount * rate).toFixed(2));
                     }
                }
                if (data.merchant) setTitle(data.merchant);
                if (data.date) setDate(data.date);
                if (data.category) {
                    const matchedCat = EXPENSE_CATEGORIES.find(c => c.name.toLowerCase() === data.category?.toLowerCase()) || EXPENSE_CATEGORIES.find(c => c.name === 'Other') || EXPENSE_CATEGORIES[0];
                    setCategory(matchedCat);
                }
                setType('expense');
            }
        } catch (error) { 
            console.error(error);
            alert("Analysis failed. Please try again."); 
        } 
        finally { setIsAnalyzing(false); }
    };

    const handleAiTextParse = async (text: string) => {
        setIsAnalyzing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                     {
                        role: 'user',
                        parts: [{ text: `Extract details: "${text}". Valid categories: ${[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c=>c.name).join(', ')}. Return JSON.` }]
                     }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            amount: { type: Type.NUMBER },
                            merchant: { type: Type.STRING },
                            category: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["income", "expense"] }
                        }
                    }
                }
            });

            if (response.text) {
                const rawData = JSON.parse(response.text.replace(/```json|```/g, '').trim());
                const parseResult = AiResponseSchema.safeParse(rawData);
                
                if (!parseResult.success) {
                    alert("Could not understand the text.");
                    return;
                }

                const data = parseResult.data;

                if (data.amount) setAmount(data.amount.toString());
                if (data.merchant) setTitle(data.merchant);
                if (data.type) setType(data.type as TransactionType);
                if (data.category) {
                     const list = data.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                     const found = list.find(c => c.name.toLowerCase() === data.category?.toLowerCase());
                     if(found) setCategory(found);
                }
            }
        } catch (error) { console.error(error); }
        finally { setIsAnalyzing(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;
        
        const totalSplit = splits.reduce((acc, s) => acc + (s.amount || 0), 0);
        if (isSplitMode && Math.abs(parseFloat(amount) - totalSplit) >= 1) {
            alert(`Split amounts must equal total (${amount}).`);
            return;
        }

        const txData: Transaction = {
            id: initialData ? initialData.id : Date.now(),
            title: title || (isSplitMode ? 'Split Transaction' : category.name),
            category: isSplitMode ? 'Split' : category.name,
            amount: parseFloat(amount),
            date: new Date(date).toISOString(),
            type,
            // Removed 'icon' property to prevent DataCloneError in WebWorkers
            splits: isSplitMode ? splits : undefined,
            attachment: attachment || undefined
        };
        
        if (selectedCurrency !== currency) {
            txData.originalAmount = parseFloat(originalAmount);
            txData.originalCurrency = selectedCurrency;
            txData.exchangeRate = parseFloat(amount) / parseFloat(originalAmount);
        }

        onSave(txData);
    };

    return {
        amount, setAmount,
        title, setTitle,
        type, setType,
        date, setDate,
        category, setCategory,
        selectedCurrency, setSelectedCurrency,
        originalAmount, setOriginalAmount,
        isSplitMode, setIsSplitMode,
        splits, setSplits,
        attachment, setAttachment,
        isAnalyzing,
        currentCategoryList,
        currencyCodes,
        handleAttachment,
        analyzeReceipt,
        handleAiTextParse,
        handleSubmit
    };
};
