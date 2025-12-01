
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContextMetadata, BudgetContext } from '../types';
import { dbItems, STORES, clearAllStores } from '../utils/db';

interface UserContextType {
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
    
    lastBackupDate: string | null;
    setLastBackupDate: (date: string) => void;
    lastCloudSync: string | null;
    setLastCloudSync: (date: string) => void;
    
    resetData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [userName, setUserName] = useState('User');
    const [activeContext, setActiveContext] = useState<BudgetContext>('personal');
    const [customContexts, setCustomContexts] = useState<ContextMetadata[]>([]);
    
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
    const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        const loadUser = async () => {
            if (typeof window === 'undefined') return;
            
            const savedOnboard = localStorage.getItem('emerald_onboarded');
            if (savedOnboard) setIsOnboarded(JSON.parse(savedOnboard));
            
            const savedName = localStorage.getItem('emerald_user_name');
            if (savedName) setUserName(savedName);
            
            const savedCtx = localStorage.getItem('emerald_active_context');
            if (savedCtx) setActiveContext(savedCtx as BudgetContext);
            
            const backupDate = localStorage.getItem('emerald_last_backup');
            if (backupDate) setLastBackupDate(backupDate);
            
            const syncDate = localStorage.getItem('emerald_last_cloud_sync');
            if (syncDate) setLastCloudSync(syncDate);

            try {
                const dbContexts = await dbItems.getAll(STORES.CONTEXTS);
                // CHANGE: Do NOT set defaults if DB is empty. 
                // This forces the BudgetSelector to see an empty list and trigger the "Create Budget" form.
                if (dbContexts.length > 0) {
                    setCustomContexts(dbContexts);
                }
            } catch (e) { console.error("Failed to load contexts", e); }
        };
        loadUser();
    }, []);

    // Persistence
    useEffect(() => { localStorage.setItem('emerald_user_name', userName); }, [userName]);
    useEffect(() => { localStorage.setItem('emerald_active_context', activeContext); }, [activeContext]);
    useEffect(() => { localStorage.setItem('emerald_onboarded', JSON.stringify(isOnboarded)); }, [isOnboarded]);
    useEffect(() => { if(lastBackupDate) localStorage.setItem('emerald_last_backup', lastBackupDate); }, [lastBackupDate]);
    useEffect(() => { if(lastCloudSync) localStorage.setItem('emerald_last_cloud_sync', lastCloudSync); }, [lastCloudSync]);

    const completeOnboarding = async (name: string, clearData = false) => {
        setUserName(name);
        if (clearData) {
            // Optimistically clear state so UI updates immediately when onboarded becomes true
            setCustomContexts([]); 
            
            // Clear Database
            await clearAllStores();
            
            // No default context to set; BudgetSelector will handle creation
        }
        setIsOnboarded(true);
    };

    const addContext = (contextData: Partial<ContextMetadata> & { name: string; budgetAmount: number; }) => {
        const id = Date.now().toString();
        if (!customContexts.some(c => c.name.toLowerCase() === contextData.name.toLowerCase())) {
            const newContext: ContextMetadata = {
                id,
                name: contextData.name,
                description: contextData.description || '',
                icon: contextData.icon || 'Folder',
                timeline: contextData.timeline || 'monthly',
                type: 'custom',
                startDate: contextData.startDate,
                endDate: contextData.endDate,
            };
            setCustomContexts(prev => [...prev, newContext]);
            dbItems.put(STORES.CONTEXTS, newContext);
            return id;
        }
        return null;
    };

    const updateContext = (id: string, updates: Partial<ContextMetadata>) => {
        setCustomContexts(prev => {
            const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
            const updated = next.find(c => c.id === id);
            if (updated) dbItems.put(STORES.CONTEXTS, updated);
            return next;
        });
    };

    const deleteContext = (id: string) => {
        // CHANGE: Removed restriction "if (customContexts.length <= 1) return;"
        // We now allow deleting the last budget.
        
        dbItems.delete(STORES.CONTEXTS, id);
        const updated = customContexts.filter(c => c.id !== id);
        setCustomContexts(updated);
        
        if (activeContext === id) {
             // If we deleted the active one, try to switch to another
             if (updated.length > 0) {
                 setActiveContext(updated[0].id);
             }
             // If updated is empty, BudgetSelector will handle the "Create New" flow
        }
    };

    const resetData = async () => {
        localStorage.clear();
        await clearAllStores();
        // Force reload to clear all React state and ensure clean onboarding
        window.location.reload();
    };

    return (
        <UserContext.Provider value={{
            userName, setUserName, activeContext, setActiveContext,
            customContexts, addContext, updateContext, deleteContext,
            isOnboarded, completeOnboarding, resetData,
            lastBackupDate, setLastBackupDate,
            lastCloudSync, setLastCloudSync
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
};
