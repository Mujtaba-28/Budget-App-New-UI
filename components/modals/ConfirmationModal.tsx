
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4 mx-auto text-rose-500">
            <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-center text-slate-500 dark:text-slate-400 text-xs font-medium mb-6 leading-relaxed px-2">{message}</p>
        <div className="flex flex-col gap-2">
            <button onClick={onConfirm} className="w-full py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 text-sm shadow-sm">{confirmText}</button>
            <button onClick={onCancel} className="w-full py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
};
