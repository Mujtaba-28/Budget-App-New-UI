
import * as Lucide from 'lucide-react';
const { 
  TrendingUp, ShoppingBag, Car, Coffee, Zap, Smartphone, Activity, 
  GraduationCap, MapPin, Gift, Briefcase, Plus, HelpCircle
} = Lucide;

import { Category, Transaction, Subscription, Goal, Debt } from './types';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: Coffee, color: 'bg-orange-100 text-orange-600', code: '#f97316' },
  { id: 'groceries', name: 'Groceries', icon: ShoppingBag, color: 'bg-green-100 text-green-600', code: '#22c55e' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600', code: '#3b82f6' },
  { id: 'bills', name: 'Bills', icon: Zap, color: 'bg-yellow-100 text-yellow-600', code: '#eab308' },
  { id: 'ent', name: 'Fun', icon: Smartphone, color: 'bg-purple-100 text-purple-600', code: '#a855f7' },
  { id: 'health', name: 'Health', icon: Activity, color: 'bg-rose-100 text-rose-600', code: '#f43f5e' }, 
  { id: 'edu', name: 'Education', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600', code: '#6366f1' },
  { id: 'travel', name: 'Travel', icon: MapPin, color: 'bg-sky-100 text-sky-600', code: '#0ea5e9' }, 
  { id: 'gift', name: 'Gift', icon: Gift, color: 'bg-pink-100 text-pink-600', code: '#ec4899' },
  { id: 'invest', name: 'Invest', icon: Briefcase, color: 'bg-teal-100 text-teal-600', code: '#14b8a6' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'freelance', name: 'Freelance', icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
  { id: 'gift_in', name: 'Gift', icon: Gift, color: 'bg-pink-100 text-pink-600' },
  { id: 'other', name: 'Other', icon: Plus, color: 'bg-slate-100 text-slate-600' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, title: 'Salary Credit', category: 'Salary', amount: 45000.00, date: new Date(2025, 10, 10).toISOString(), type: 'income' },
  { id: 2, title: 'D-Mart Grocery', category: 'Groceries', amount: 2450.00, date: new Date(2025, 10, 20).toISOString(), type: 'expense' },
  { id: 3, title: 'Petrol Pump', category: 'Transport', amount: 500.00, date: new Date(2025, 10, 23).toISOString(), type: 'expense' },
  { id: 4, title: 'Dinner Out', category: 'Food', amount: 1500.00, date: new Date(2025, 10, 24).toISOString(), type: 'expense' },
  { id: 5, title: 'Subscription', category: 'Bills', amount: 499.00, date: new Date(2025, 11, 5).toISOString(), type: 'expense' },
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
    { id: '1', name: 'Netflix', amount: 649, billingCycle: 'monthly', nextBillingDate: new Date(2025, 11, 1).toISOString(), category: 'Fun' },
    { id: '2', name: 'Spotify', amount: 119, billingCycle: 'monthly', nextBillingDate: new Date(2025, 11, 5).toISOString(), category: 'Fun' },
    { id: '3', name: 'Gym', amount: 2000, billingCycle: 'monthly', nextBillingDate: new Date(2025, 11, 10).toISOString(), category: 'Health' },
];

export const INITIAL_GOALS: Goal[] = [
    { id: '1', name: 'Emergency Fund', targetAmount: 100000, currentAmount: 25000, color: 'bg-emerald-500', icon: 'shield' },
    { id: '2', name: 'New Laptop', targetAmount: 80000, currentAmount: 15000, color: 'bg-indigo-500', icon: 'laptop' },
    { id: '3', name: 'Vacation', targetAmount: 50000, currentAmount: 5000, color: 'bg-sky-500', icon: 'plane' },
];

export const INITIAL_DEBTS: Debt[] = [
    { id: '1', name: 'Credit Card', currentBalance: 45000, interestRate: 36, minimumPayment: 2250, category: 'Credit Card' },
    { id: '2', name: 'Personal Loan', currentBalance: 120000, interestRate: 14, minimumPayment: 5000, category: 'Loan' },
];

export const INITIAL_BUDGETS = {
    '2025-10': 55000,
    '2025-11': 60000,
    '2025-12': 70000,
    'default': 60000,
};

export const getCategoryDetails = (name: string, type: string) => {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find(c => c.name === name) || { name: name, icon: HelpCircle, color: 'bg-gray-100 text-gray-600' };
};
