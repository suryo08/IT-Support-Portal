'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed / opened from home screen)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // 2. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration note:', err?.message);
      });
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Check if user recently dismissed banner in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';

    // 5. Listen for Android Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on iOS and not dismissed, show install banner after brief delay
    if (isIosDevice && !isDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android / Chrome flow
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS / other browser flow -> open guide modal
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Mobile Install Banner */}
      {showBanner && (
        <div
          data-testid="pwa-install-banner"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white/95 backdrop-blur-md border border-brand-200 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-start gap-3.5">
            <img
              src="/web-app-manifest-192x192.png"
              alt="Fix IT Logo"
              className="w-12 h-12 rounded-xl object-contain border border-slate-100 shadow-xs flex-shrink-0 bg-white"
            />
            <div className="flex-1 min-w-0 pr-6">
              <h4
                className="text-sm font-bold text-slate-900 leading-snug"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Pasang Pintasan Fix IT
              </h4>
              <p
                className="text-xs text-slate-600 mt-0.5 leading-relaxed"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
              >
                Akses portal panduan IT lebih cepat langsung dari layar utama smartphone Anda.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="bg-brand-500 hover:bg-brand-600 text-white text-xs h-8 px-3.5 rounded-lg shadow-sm font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pasang Sekarang</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-slate-500 hover:text-slate-700 text-xs h-8 px-2.5 rounded-lg"
                >
                  Nanti Saja
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal for iOS / Safari or Manual Installation */}
      {showIosModal && (
        <div
          data-testid="pwa-guide-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <img
                  src="/web-app-manifest-192x192.png"
                  alt="Fix IT Logo"
                  className="w-10 h-10 rounded-xl object-contain border border-slate-100 shadow-xs bg-white"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Tambah ke Layar Utama
                  </h3>
                  <p className="text-[11px] text-slate-500">Pintasan resmi Fix IT</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="p-5 space-y-4 text-xs text-slate-700" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {isIos ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      1
                    </div>
                    <p className="leading-relaxed">
                      Ketuk tombol <strong>Bagikan (Share)</strong>{' '}
                      <Share className="w-3.5 h-3.5 inline mx-1 text-brand-600" /> di bilah bawah browser Safari Anda.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      2
                    </div>
                    <p className="leading-relaxed">
                      Gulir ke bawah pada menu yang muncul, lalu pilih{' '}
                      <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (<em>Add to Home Screen</em>){' '}
                      <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-brand-600" />.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      3
                    </div>
                    <p className="leading-relaxed">
                      Ketuk <strong>&quot;Tambah&quot;</strong> (<em>Add</em>) di pojok kanan atas.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      1
                    </div>
                    <p className="leading-relaxed">
                      Ketuk ikon <strong>menu titik tiga (⋮)</strong> di sudut kanan atas browser Anda.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      2
                    </div>
                    <p className="leading-relaxed">
                      Pilih menu <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> atau{' '}
                      <strong>&quot;Pasang Aplikasi&quot;</strong> (<em>Install App</em>).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      3
                    </div>
                    <p className="leading-relaxed">
                      Ketuk <strong>&quot;Pasang / Tambah&quot;</strong> untuk membuat ikon di smartphone Anda.
                    </p>
                  </div>
                </>
              )}

              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center gap-2.5 mt-2">
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="text-[11px] text-brand-800 font-medium">
                  Ikon Fix IT berkualitas tinggi (HD) akan langsung terpasang di layar HP Anda.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button
                size="sm"
                onClick={() => setShowIosModal(false)}
                className="bg-brand-500 text-white hover:bg-brand-600 text-xs px-4 h-8 rounded-lg"
              >
                Mengerti
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
