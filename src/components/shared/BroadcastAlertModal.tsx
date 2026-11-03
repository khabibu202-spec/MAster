import React from 'react';
import { Megaphone, X, Bell, ShieldCheck, Check } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../lib/utils';

export function BroadcastAlertModal() {
  const { activeBroadcast, dismissBroadcast } = useData();

  if (!activeBroadcast) return null;

  const isWarning = activeBroadcast.level === 'warning';
  const isSuccess = activeBroadcast.level === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        {/* Accent top stripe */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1.5",
          isWarning ? "bg-amber-500" : isSuccess ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-cyan-500"
        )} />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-2xl text-white shadow-sm shrink-0",
              isWarning ? "bg-amber-500 shadow-amber-500/30" : isSuccess ? "bg-emerald-500 shadow-emerald-500/30" : "bg-indigo-600 shadow-indigo-600/30"
            )}>
              <Megaphone className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Pemberitahuan Terpusat
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {activeBroadcast.title}
              </h3>
            </div>
          </div>

          <button
            onClick={dismissBroadcast}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {activeBroadcast.message}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
            Oleh: {activeBroadcast.sender}
          </span>
          <span>{new Date(activeBroadcast.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
        </div>

        <button
          onClick={dismissBroadcast}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4" />
          <span>Saya Mengerti / Tutup</span>
        </button>
      </div>
    </div>
  );
}
