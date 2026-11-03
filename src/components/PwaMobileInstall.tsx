import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PwaMobileInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if prompt is already saved on window
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    // Listen for the event in case it hasn't fired yet
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check local storage to see if user dismissed it previously
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!deferredPrompt || isDismissed) {
    return null;
  }

  return (
    <div className="sm:hidden fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-primary-800">
        <div className="flex flex-col">
          <p className="font-semibold text-sm">Instal SIM Sarpras</p>
          <p className="text-xs text-primary-200 mt-0.5">Akses lebih cepat & offline via Home Screen</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleInstall}
            className="bg-white text-primary-900 text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Instal
          </button>
          <button 
            onClick={handleDismiss}
            className="p-2 text-primary-300 hover:text-white rounded-full active:bg-primary-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
