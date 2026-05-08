"use client";

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep it',
  loading = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!open) return null;

  const danger = tone === 'danger';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
        aria-label="Close confirmation"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className={`h-1.5 ${danger ? 'bg-red-500' : 'bg-amber-500'}`} />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="confirmation-title" className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close confirmation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-white shadow-sm disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {loading ? 'Working...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
