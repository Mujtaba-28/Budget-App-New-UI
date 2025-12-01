
import React from 'react';

export interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  code?: string;
}

export type TransactionType = 'income' | 'expense';
export type BudgetContext = string;

export interface ContextMetadata {
    id: string;
    name: string;
    description?: string;
    timeline: 'weekly' | 'monthly' | 'yearly' | 'one-time';
    type: 'custom' | 'personal' | 'business';
    icon?: string;
    budgetScope?: 'recurring' | 'specific'; // Kept for compatibility, but timeline is now primary
    startDate?: string;
    endDate?: string;
}

export interface TransactionSplit {
  category: string;
  amount: number;
  note?: string;
}

export interface Transaction {
  id: number;
  title: string;
  category: string;
  amount: number; // Stored in Base Currency
  date: string;
  type: TransactionType;
  context?: BudgetContext; // New: Personal vs Business
  icon?: any;
  // Multi-currency support
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  // Split support
  splits?: TransactionSplit[];
  // File Attachment
  attachment?: string; // Temporary holder for Modal editing
  hasAttachment?: boolean; // Lightweight flag for List views (RAM Optimized)
}

export interface BudgetMap {
  [key: string]: number;
}

export interface CategoryData extends Category {
  amount: number;
  budget?: number; 
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  nextBillingDate: string;
  category: string;
  autoPay?: boolean;
  context?: BudgetContext;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  icon?: string;
  context?: BudgetContext;
}

export interface Debt {
  id: string;
  name: string;
  currentBalance: number;
  interestRate: number; // APR %
  minimumPayment: number;
  category: string; 
  context?: BudgetContext;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface DashboardCard {
  id: string;
  label: string;
  visible: boolean;
}

export interface BackupData {
  version: number;
  timestamp: string;
  transactions: Transaction[];
  budgets: BudgetMap;
  subscriptions: Subscription[];
  goals: Goal[];
  debts: Debt[];
  attachments: Record<string, string>; // ID -> Base64
  theme?: {
    isDark: boolean;
    currency: string;
  };
  customContexts?: ContextMetadata[];
}
