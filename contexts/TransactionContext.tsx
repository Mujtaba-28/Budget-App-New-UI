
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, BudgetMap } from '../types';
import { dbItems, STORES, saveAttachmentSafe, deleteAttachment, getAttachment } from '../utils/db';
import { useUser } from './UserContext';
import { getMonthKey } from '../utils';

interface TransactionContextType {
    transactions: Transaction[];
    budgets: BudgetMap;
    addTransaction: (tx: Transaction) => Promise<void>;
    updateTransaction: (tx: Transaction) => Promise<void>;
    deleteTransaction: (id: number) => Promise<void>;
    importTransactions: (txs: Transaction[]) => void;
    updateBudget: (amount: number, monthKey: string, category?: string, contextId?: string) => void;
    refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { activeContext, isOnboarded } = useUser();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<BudgetMap>({});

    const loadData = async () => {
        try {
            // OPTIMIZATION: Load only transactions for the ACTIVE context
            const txs = await dbItems.getFromIndex(STORES.TRANSACTIONS, 'context', activeContext);
            setTransactions(txs);

            // Load Budgets
            const dbBudgets = await dbItems.getAll(STORES.BUDGETS);
            const budgetMap: BudgetMap = {};
            dbBudgets.forEach((b: any) => budgetMap[b.key] = b.amount);
            setBudgets(budgetMap);

        } catch (e) {
            console.error("Transaction Load Error", e);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeContext, isOnboarded]);

    const addTransaction = async (tx: Transaction) => {
        if (tx.attachment) await saveAttachmentSafe(tx.id, tx.attachment);
        
        // Allow tx.context to override activeContext (Useful for Demo Data injection)
        const contextToUse = tx.context || activeContext;
        const optimizedTx = { ...tx, attachment: undefined, hasAttachment: !!tx.attachment, context: contextToUse };
        
        // Only update local state if the transaction belongs to the currently visible context
        if (contextToUse === activeContext) {
             setTransactions(prev => [optimizedTx, ...prev]);
        }
        await dbItems.put(STORES.TRANSACTIONS, optimizedTx);
    };

    const updateTransaction = async (tx: Transaction) => {
        if (tx.attachment) await saveAttachmentSafe(tx.id, tx.attachment);
        
        const contextToUse = tx.context || activeContext;
        const optimizedTx = { ...tx, attachment: undefined, hasAttachment: !!tx.attachment || !!tx.hasAttachment };
        
        if (contextToUse === activeContext) {
            setTransactions(prev => prev.map(t => t.id === tx.id ? { ...optimizedTx, context: contextToUse } : t));
        }
        await dbItems.put(STORES.TRANSACTIONS, { ...optimizedTx, context: contextToUse });
    };

    const deleteTransaction = async (id: number) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        await dbItems.delete(STORES.TRANSACTIONS, id);
        try { deleteAttachment(id); } catch(e){}
    };

    const importTransactions = (txs: Transaction[]) => {
        const taggedTxs = txs.map(t => ({ ...t, context: activeContext }));
        setTransactions(prev => [...taggedTxs, ...prev]);
        dbItems.bulkPut(STORES.TRANSACTIONS, taggedTxs);
    };

    const updateBudget = (amount: number, monthKey: string, category?: string, contextId?: string) => {
        const prefix = contextId || activeContext;
        // Ensure format is correct
        const cleanMonthKey = monthKey.replace(/^(personal|business|.*)-(\d{4}-\d{2})$/, '$2');
        const finalKey = `${prefix}-${cleanMonthKey}`;

        if (category) {
            const catKey = `${finalKey}-category-${category}`;
            setBudgets(prev => ({ ...prev, [catKey]: amount }));
            dbItems.put(STORES.BUDGETS, { key: catKey, amount });
        } else {
            setBudgets(prev => ({ ...prev, [finalKey]: amount }));
            dbItems.put(STORES.BUDGETS, { key: finalKey, amount });
        }
    };

    return (
        <TransactionContext.Provider value={{
            transactions, budgets,
            addTransaction, updateTransaction, deleteTransaction, importTransactions,
            updateBudget, refreshTransactions: loadData
        }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) throw new Error("useTransactions must be used within TransactionProvider");
    return context;
};
