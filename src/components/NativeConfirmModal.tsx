'use client';

import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Info, X } from 'lucide-react';

interface NativeConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function NativeConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDestructive = false,
  type = 'warning',
  onConfirm,
  onCancel,
}: NativeConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    onConfirm();
  };

  const handleCancel = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleCancel} />

      {/* Dialog Box */}
      <div className="relative z-10 w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-scale-up text-center space-y-4">
        {/* Icon Indicator */}
        <div className="flex justify-center">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
              isDestructive || type === 'danger'
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : type === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}
          >
            {isDestructive || type === 'danger' ? (
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            ) : type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 px-1">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons (iOS/Flutter Style Action Grid) */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleConfirm}
            className={`w-full py-3 rounded-2xl text-xs font-bold transition-transform active:scale-95 shadow-xs ${
              isDestructive || type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={handleCancel}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-transform active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
