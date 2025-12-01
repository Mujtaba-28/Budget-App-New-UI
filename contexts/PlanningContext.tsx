
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subscription, Goal, Debt } from '../types';
import { dbItems, STORES } from '../utils/db';
import { useUser } from './UserContext';

interface PlanningContextType {
    subscriptions: Subscription[];
    goals: Goal[];
    debts: Debt[];
    addSubscription: (sub: Subscription) => void;
    updateSubscription: (sub: Subscription) => void;
    deleteSubscription: (id: string) => void;
    addGoal: (goal: Goal) => void;
    updateGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;
    addDebt: (debt: Debt) => void;
    updateDebt: (debt: Debt) => void;
    deleteDebt: (id: string) => void;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const PlanningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { activeContext, isOnboarded } = useUser();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);

    // Optimized Loading: Only fetch data for the ACTIVE context
    useEffect(() => {
        const loadPlanningData = async () => {
            try {
                // Fetch only items where context == activeContext
                const [subs, gs, ds] = await Promise.all([
                    dbItems.getFromIndex(STORES.SUBSCRIPTIONS, 'context', activeContext),
                    dbItems.getFromIndex(STORES.GOALS, 'context', activeContext),
                    dbItems.getFromIndex(STORES.DEBTS, 'context', activeContext)
                ]);

                setSubscriptions(subs);
                setGoals(gs);
                setDebts(ds);
            } catch (e) {
                console.error("Planning Data Load Error", e);
            }
        };
        loadPlanningData();
    }, [activeContext, isOnboarded]);

    const addSubscription = (sub: Subscription) => {
        const contextToUse = sub.context || activeContext;
        const newSub = { ...sub, context: contextToUse };
        if (contextToUse === activeContext) {
            setSubscriptions(prev => [...prev, newSub]);
        }
        dbItems.put(STORES.SUBSCRIPTIONS, newSub);
    };
    const updateSubscription = (sub: Subscription) => {
        const contextToUse = sub.context || activeContext;
        const updated = { ...sub, context: contextToUse };
        if (contextToUse === activeContext) {
            setSubscriptions(prev => prev.map(s => s.id === sub.id ? updated : s));
        }
        dbItems.put(STORES.SUBSCRIPTIONS, updated);
    };
    const deleteSubscription = (id: string) => {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
        dbItems.delete(STORES.SUBSCRIPTIONS, id);
    };

    const addGoal = (goal: Goal) => {
        const contextToUse = goal.context || activeContext;
        const newGoal = { ...goal, context: contextToUse };
        if (contextToUse === activeContext) {
            setGoals(prev => [...prev, newGoal]);
        }
        dbItems.put(STORES.GOALS, newGoal);
    };
    const updateGoal = (goal: Goal) => {
        const contextToUse = goal.context || activeContext;
        const updated = { ...goal, context: contextToUse };
        if (contextToUse === activeContext) {
            setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
        }
        dbItems.put(STORES.GOALS, updated);
    };
    const deleteGoal = (id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
        dbItems.delete(STORES.GOALS, id);
    };

    const addDebt = (debt: Debt) => {
        const contextToUse = debt.context || activeContext;
        const newDebt = { ...debt, context: contextToUse };
        if (contextToUse === activeContext) {
            setDebts(prev => [...prev, newDebt]);
        }
        dbItems.put(STORES.DEBTS, newDebt);
    };
    const updateDebt = (debt: Debt) => {
        const contextToUse = debt.context || activeContext;
        const updated = { ...debt, context: contextToUse };
        if (contextToUse === activeContext) {
            setDebts(prev => prev.map(d => d.id === debt.id ? updated : d));
        }
        dbItems.put(STORES.DEBTS, updated);
    };
    const deleteDebt = (id: string) => {
        setDebts(prev => prev.filter(d => d.id !== id));
        dbItems.delete(STORES.DEBTS, id);
    };

    return (
        <PlanningContext.Provider value={{
            subscriptions, goals, debts,
            addSubscription, updateSubscription, deleteSubscription,
            addGoal, updateGoal, deleteGoal,
            addDebt, updateDebt, deleteDebt
        }}>
            {children}
        </PlanningContext.Provider>
    );
};

export const usePlanning = () => {
    const context = useContext(PlanningContext);
    if (!context) throw new Error("usePlanning must be used within PlanningProvider");
    return context;
};
