
import { z } from 'zod';

// Helper for dates
const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
});

export const TransactionSchema = z.object({
    id: z.number(),
    title: z.string().min(1),
    category: z.string(),
    amount: z.number(),
    date: dateSchema,
    type: z.enum(['income', 'expense']),
    context: z.string().optional(),
    splits: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        note: z.string().optional()
    })).optional(),
    originalAmount: z.number().optional(),
    originalCurrency: z.string().optional(),
    exchangeRate: z.number().optional(),
    attachment: z.string().optional(), // Base64
    hasAttachment: z.boolean().optional()
});

export const SubscriptionSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    amount: z.number(),
    billingCycle: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'half-yearly', 'yearly']),
    nextBillingDate: dateSchema,
    category: z.string(),
    autoPay: z.boolean().optional(),
    context: z.string().optional()
});

export const GoalSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    targetAmount: z.number(),
    currentAmount: z.number(),
    deadline: dateSchema.optional(),
    color: z.string(),
    icon: z.string().optional(),
    context: z.string().optional()
});

export const DebtSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    currentBalance: z.number(),
    interestRate: z.number(),
    minimumPayment: z.number(),
    category: z.string(),
    context: z.string().optional()
});

export const ContextSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    timeline: z.enum(['weekly', 'monthly', 'yearly', 'one-time']),
    type: z.enum(['custom', 'personal', 'business']),
    icon: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

// Full Backup Schema
export const BackupSchema = z.object({
    version: z.number(),
    timestamp: z.string(),
    transactions: z.array(TransactionSchema),
    budgets: z.record(z.string(), z.number()),
    subscriptions: z.array(SubscriptionSchema),
    goals: z.array(GoalSchema),
    debts: z.array(DebtSchema),
    customContexts: z.array(ContextSchema).optional(),
    theme: z.object({
        isDark: z.boolean(),
        currency: z.string()
    }).optional(),
    attachments: z.record(z.string(), z.string()).optional()
});
