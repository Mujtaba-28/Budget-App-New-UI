
import React, { ReactNode } from 'react';
import { useUser } from './UserContext';
import { usePlanning } from './PlanningContext';
import { useTransactions } from './TransactionContext';
import { Transaction, BudgetMap, Subscription, Goal, Debt, BackupData, BudgetContext, ContextMetadata } from '../types';
import { dbItems, getAllAttachments, saveAttachmentSafe, STORES } from '../utils/db';
import { BackupSchema } from '../utils/validation';
import { shareFile } from '../utils';

// Defined directly here as it is an aggregation of multiple contexts
export interface FinanceContextType {
    // User
    userName: string;
    setUserName: (name: string) => void;
    activeContext: BudgetContext;
    setActiveContext: (ctx: BudgetContext) => void;
    customContexts: ContextMetadata[];
    addContext: (contextData: Partial<ContextMetadata> & { name: string; budgetAmount: number; }) => string | null;
    updateContext: (id: string, updates: Partial<ContextMetadata>) => void;
    deleteContext: (id: string) => void;
    isOnboarded: boolean;
    completeOnboarding: (name: string, clearData?: boolean) => Promise<void>;
    resetData: () => Promise<void>;
    lastBackupDate: string | null;
    lastCloudSync: string | null;
    dataError: boolean;

    // Planning
    subscriptions: Subscription[];
    addSubscription: (sub: Subscription) => void;
    updateSubscription: (sub: Subscription) => void;
    deleteSubscription: (id: string) => void;
    goals: Goal[];
    addGoal: (goal: Goal) => void;
    updateGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;
    debts: Debt[];
    addDebt: (debt: Debt) => void;
    updateDebt: (debt: Debt) => void;
    deleteDebt: (id: string) => void;

    // Transactions
    transactions: Transaction[];
    budgets: BudgetMap;
    addTransaction: (tx: Transaction) => Promise<void>;
    updateTransaction: (tx: Transaction) => Promise<void>;
    deleteTransaction: (id: number) => Promise<void>;
    importTransactions: (txs: Transaction[]) => void;
    updateBudget: (amount: number, monthKey: string, category?: string, contextId?: string) => void;

    // Global
    createBackup: () => Promise<void>;
    syncToCloud: () => Promise<void>;
    restoreBackup: (file: File) => Promise<void>;
}

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // This component is now deprecated as a Provider logic container. 
    // It exists only to prevent breaking changes if someone imports FinanceProvider specifically.
    // The actual providers are now in index.tsx
    return <>{children}</>;
};

// Facade Hook
export const useFinance = (): FinanceContextType => {
    const user = useUser();
    const planning = usePlanning();
    const txs = useTransactions();
    
    // Derived Actions that span multiple domains (Backup/Restore)
    
    const createBackup = async () => {
        try {
            // Need to fetch ALL data for backup, not just active context
            const [allTxs, allBudgetsArr, allSubs, allGoals, allDebts, allContexts] = await Promise.all([
                dbItems.getAll(STORES.TRANSACTIONS),
                dbItems.getAll(STORES.BUDGETS),
                dbItems.getAll(STORES.SUBSCRIPTIONS),
                dbItems.getAll(STORES.GOALS),
                dbItems.getAll(STORES.DEBTS),
                dbItems.getAll(STORES.CONTEXTS)
            ]);
            
            const budgetMap: BudgetMap = {};
            allBudgetsArr.forEach((b: any) => budgetMap[b.key] = b.amount);
            
            const attachments = await getAllAttachments();
            
            const backup: BackupData = {
                version: 1,
                timestamp: new Date().toISOString(),
                transactions: allTxs,
                budgets: budgetMap,
                subscriptions: allSubs,
                goals: allGoals,
                debts: allDebts,
                customContexts: allContexts,
                attachments,
                theme: {
                    isDark: JSON.parse(localStorage.getItem('emerald_theme') || 'false'),
                    currency: localStorage.getItem('emerald_currency') || '₹'
                }
            };
            
            const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `emerald_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            const now = new Date().toISOString();
            user.setLastBackupDate(now);
        } catch (e) { alert("Failed to create backup."); }
    };

    const syncToCloud = async () => {
        try {
            // Similar to createBackup but shares file
             const [allTxs, allBudgetsArr, allSubs, allGoals, allDebts, allContexts] = await Promise.all([
                dbItems.getAll(STORES.TRANSACTIONS),
                dbItems.getAll(STORES.BUDGETS),
                dbItems.getAll(STORES.SUBSCRIPTIONS),
                dbItems.getAll(STORES.GOALS),
                dbItems.getAll(STORES.DEBTS),
                dbItems.getAll(STORES.CONTEXTS)
            ]);
            const budgetMap: BudgetMap = {};
            allBudgetsArr.forEach((b: any) => budgetMap[b.key] = b.amount);
            const attachments = await getAllAttachments();
            
             const backup: BackupData = {
                version: 1,
                timestamp: new Date().toISOString(),
                transactions: allTxs,
                budgets: budgetMap,
                subscriptions: allSubs,
                goals: allGoals,
                debts: allDebts,
                customContexts: allContexts,
                attachments,
                theme: {
                    isDark: JSON.parse(localStorage.getItem('emerald_theme') || 'false'),
                    currency: localStorage.getItem('emerald_currency') || '₹'
                }
            };

            const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
            const file = new File([blob], `emerald_backup_${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });
            
            const success = await shareFile(file, 'Emerald Backup', 'Backing up my financial data.');
            if (success) {
                const now = new Date().toISOString();
                user.setLastCloudSync(now);
            } else {
                createBackup();
                alert("Native sharing not supported. File downloaded instead.");
            }
        } catch (e) { alert("Failed to sync."); }
    };

    const restoreBackup = async (file: File) => {
        try {
            const text = await file.text();
            let data: any;
            try { data = JSON.parse(text); } catch(e) { throw new Error("Invalid JSON file"); }

            const validation = BackupSchema.safeParse(data);
            if (!validation.success) throw new Error("Backup integrity check failed.");
            
            const validData = validation.data as BackupData;
            await dbItems.replaceDB(validData);

            localStorage.clear();
            localStorage.setItem('emerald_onboarded', 'true');
            localStorage.setItem('emerald_last_backup', new Date().toISOString());
            if (validData.theme) {
                localStorage.setItem('emerald_theme', JSON.stringify(validData.theme.isDark));
                localStorage.setItem('emerald_currency', validData.theme.currency);
            }
            if (validData.attachments) {
                 for (const [id, val] of Object.entries(validData.attachments)) {
                     await saveAttachmentSafe(id, val);
                 }
            }
            window.location.reload();
        } catch (e: any) { throw e; }
    };
    
    return {
        // User
        userName: user.userName,
        setUserName: user.setUserName,
        activeContext: user.activeContext,
        setActiveContext: user.setActiveContext,
        customContexts: user.customContexts,
        addContext: user.addContext,
        updateContext: user.updateContext,
        deleteContext: user.deleteContext,
        isOnboarded: user.isOnboarded,
        completeOnboarding: user.completeOnboarding,
        resetData: user.resetData,
        lastBackupDate: user.lastBackupDate,
        lastCloudSync: user.lastCloudSync,
        dataError: false, // Legacy

        // Planning
        subscriptions: planning.subscriptions,
        addSubscription: planning.addSubscription,
        updateSubscription: planning.updateSubscription,
        deleteSubscription: planning.deleteSubscription,
        goals: planning.goals,
        addGoal: planning.addGoal,
        updateGoal: planning.updateGoal,
        deleteGoal: planning.deleteGoal,
        debts: planning.debts,
        addDebt: planning.addDebt,
        updateDebt: planning.updateDebt,
        deleteDebt: planning.deleteDebt,

        // Transactions
        transactions: txs.transactions,
        budgets: txs.budgets,
        addTransaction: txs.addTransaction,
        updateTransaction: txs.updateTransaction,
        deleteTransaction: txs.deleteTransaction,
        importTransactions: txs.importTransactions,
        updateBudget: txs.updateBudget,

        // Global
        createBackup,
        syncToCloud,
        restoreBackup
    };
};
