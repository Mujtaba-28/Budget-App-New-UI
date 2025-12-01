import { Transaction, Debt } from '../types';

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return dateString; 

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {
    return dateString;
  }
};

export const formatMoney = (amount: number, currency: string, isPrivacyMode: boolean) => {
    if (isPrivacyMode) return '****';
    const safeAmount = isNaN(amount) ? 0 : amount;
    return `${currency} ${safeAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const getMonthKey = (date: Date) => {
    if (!date) return 'default';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export const calculateNextDate = (currentDate: string, cycle: string): string => {
    const date = new Date(currentDate);
    switch(cycle) {
        case 'daily': date.setDate(date.getDate() + 1); break;
        case 'weekly': date.setDate(date.getDate() + 7); break;
        case 'monthly': date.setMonth(date.getMonth() + 1); break;
        case 'quarterly': date.setMonth(date.getMonth() + 3); break;
        case 'half-yearly': date.setMonth(date.getMonth() + 6); break;
        case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
        default: date.setMonth(date.getMonth() + 1); break;
    }
    return date.toISOString();
};

export const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Return compressed JPEG base64
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
        };
    });
};

export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: { 
        data: await base64EncodedDataPromise, 
        mimeType: file.type 
    },
  };
};

export const shareFile = async (file: File, title: string, text: string) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title,
                text
            });
            return true;
        } catch (e) {
            console.error("Share failed", e);
            return false;
        }
    }
    return false;
};

// --- MULTI-CURRENCY UTILS ---
const EXCHANGE_RATES: Record<string, number> = {
    'INR': 1,
    'USD': 84.5,
    'EUR': 91.2,
    'GBP': 107.8,
    'AED': 23.0,
    'JPY': 0.56,
};

export const getExchangeRate = (from: string, to: string): number => {
    const fromRate = EXCHANGE_RATES[from] || 1;
    const toRate = EXCHANGE_RATES[to] || 1;
    // (Amount in Base) = Amount / BaseRate
    // Target Amount = (SourceAmount * SourceRate) / TargetRate
    // e.g. 1 USD (84.5) to INR (1) -> 1 * 84.5 / 1 = 84.5
    return fromRate / toRate; 
};

// --- DEBT PAYOFF UTILS ---
export const calculateDebtPayoff = (debts: Debt[], extraPayment: number, strategy: 'snowball' | 'avalanche') => {
    // 1. Calculate Baseline (Min payments only)
    let baselineDebts = debts.map(d => ({ ...d }));
    let baselineMonths = 0;
    let baselineInterest = 0;
    while(baselineDebts.some(d => d.currentBalance > 0.1) && baselineMonths < 600) {
        baselineMonths++;
        baselineDebts.forEach(d => {
            if(d.currentBalance > 0) {
                const interest = (d.currentBalance * (d.interestRate/100))/12;
                baselineInterest += interest;
                d.currentBalance += interest;
                const pay = Math.min(d.currentBalance, d.minimumPayment);
                d.currentBalance -= pay;
            }
        });
    }

    // 2. Calculate Accelerated (With Extra)
    let currentDebts = debts.map(d => ({ ...d }));
    let months = 0;
    let totalInterest = 0;
    
    // Sort logic
    const sortDebts = (ds: typeof currentDebts) => {
        if (strategy === 'snowball') {
            // Lowest balance first
            ds.sort((a, b) => a.currentBalance - b.currentBalance);
        } else {
            // Highest Interest Rate first
            ds.sort((a, b) => b.interestRate - a.interestRate);
        }
    };

    while (currentDebts.some(d => d.currentBalance > 0.1) && months < 600) { 
        months++;
        let availableExtra = extraPayment;

        sortDebts(currentDebts);

        // Apply minimums first
        currentDebts.forEach(debt => {
            if (debt.currentBalance > 0) {
                const interest = (debt.currentBalance * (debt.interestRate / 100)) / 12;
                totalInterest += interest;
                debt.currentBalance += interest;
                
                const payment = Math.min(debt.currentBalance, debt.minimumPayment);
                debt.currentBalance -= payment;
            }
        });

        // Apply extra to top priority
        for (const debt of currentDebts) {
            if (debt.currentBalance > 0 && availableExtra > 0) {
                const payment = Math.min(debt.currentBalance, availableExtra);
                debt.currentBalance -= payment;
                availableExtra -= payment;
            }
        }
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    return {
        months,
        payoffDate,
        totalInterest,
        baselineMonths,
        baselineInterest
    };
};

// CSV EXPORT
export const convertArrayToCSV = (arr: any[]) => {
  if (!arr || !arr.length) return '';
  const separator = ',';
  const keys = Object.keys(arr[0]).filter(k => k !== 'icon' && k !== 'splits' && k !== 'attachment'); 
  const csvContent =
    keys.join(separator) +
    '\n' +
    arr.map((row) => {
      return keys.map((k) => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toISOString() : cell.toString();
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');
  return csvContent;
};

// CSV IMPORT
export const parseCSV = (csvText: string): Partial<Transaction>[] => {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return []; 

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  
  const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('merchant') || h.includes('description'));
  const amountIdx = headers.findIndex(h => h.includes('amount'));
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const catIdx = headers.findIndex(h => h.includes('category'));
  const typeIdx = headers.findIndex(h => h.includes('type'));

  const parsedData: Partial<Transaction>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if (currentline.length < 2) continue;

    const getValue = (idx: number) => idx >= 0 && idx < currentline.length ? currentline[idx].trim().replace(/^"|"$/g, '') : '';

    const amountStr = getValue(amountIdx);
    const amount = parseFloat(amountStr);
    
    if (!isNaN(amount)) {
       parsedData.push({
           title: getValue(titleIdx) || 'Imported Transaction',
           amount: Math.abs(amount),
           date: getValue(dateIdx) ? new Date(getValue(dateIdx)).toISOString() : new Date().toISOString(),
           category: getValue(catIdx) || 'Other',
           type: (getValue(typeIdx).toLowerCase().includes('income') || amountStr.includes('+')) ? 'income' : 'expense'
       });
    }
  }
  return parsedData;
};