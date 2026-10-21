'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Download, 
  X, 
  HelpCircle, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquarePlus, 
  ZoomIn, 
  ZoomOut, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PdfViewerModal({
  selectedPdf,
  onClose,
  onDownload,
  reviewStatus,
  reviewSubmitting,
  onReview
}) {
  const [loading, setLoading] = useState(true);
  const [firstPageReady, setFirstPageReady] = useState(false);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTasksRef = useRef([]);

  // Load PDF.js script dynamically or return existing instance
  const ensurePdfJsLoaded = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
      return window.pdfjsLib;
    }

    return new Promise((resolve, reject) => {
      let script = document.getElementById('pdfjs-min-script');
      if (!script) {
        script = document.createElement('script');
        script.id = 'pdfjs-min-script';
        script.src = '/pdfjs/pdf.min.js';
        script.async = true;
        document.head.appendChild(script);
      }

      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js failed to initialize.'));
        }
      };

      script.onerror = () => {
        // Fallback to CDN if local file fails
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        fallbackScript.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          } else {
            reject(new Error('PDF.js CDN failed to load.'));
          }
        };
        fallbackScript.onerror = () => reject(new Error('Gagal memuat engine PDF viewer.'));
        document.head.appendChild(fallbackScript);
      };
    });
  }, []);

  // Cancel any ongoing canvas renders
  const cancelRenderTasks = () => {
    renderTasksRef.current.forEach((task) => {
      try {
        if (task && task.cancel) task.cancel();
      } catch (e) {}
    });
    renderTasksRef.current = [];
  };

  // Render all pages progressively to canvas (Page 1 first for instant paint!)
  const renderAllPages = useCallback(async (pdfDoc, currentScale) => {
    if (!pdfDoc || !containerRef.current) return;
    cancelRenderTasks();

    const container = containerRef.current;
    const containerWidth = container.clientWidth || window.innerWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    try {
      const firstPage = await pdfDoc.getPage(1);
      const unscaledViewport = firstPage.getViewport({ scale: 1 });
      
      // Calculate responsive fit-width scale (fits 100% horizontally on phone)
      const horizontalPadding = window.innerWidth < 640 ? 16 : 32;
      const availableWidth = Math.max(containerWidth - horizontalPadding, 260);
      const fitScale = (availableWidth / unscaledViewport.width);
      const finalScale = fitScale * currentScale;

      // 1. Render Page 1 first
      const viewport1 = firstPage.getViewport({ scale: finalScale });
      const canvas1 = document.getElementById(`pdf-page-canvas-1`);
      if (canvas1) {
        const ctx1 = canvas1.getContext('2d');
        if (ctx1) {
          canvas1.width = Math.floor(viewport1.width * dpr);
          canvas1.height = Math.floor(viewport1.height * dpr);
          canvas1.style.width = `${Math.floor(viewport1.width)}px`;
          canvas1.style.height = `${Math.floor(viewport1.height)}px`;
          ctx1.setTransform(dpr, 0, 0, dpr, 0, 0);
          const task1 = firstPage.render({ canvasContext: ctx1, viewport: viewport1 });
          renderTasksRef.current.push(task1);
          await task1.promise;
        }
      }

      setFirstPageReady(true);

      // 2. Render remaining pages progressively in background
      for (let pageNum = 2; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: finalScale });
        const canvas = document.getElementById(`pdf-page-canvas-${pageNum}`);
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTasksRef.current.push(renderTask);

        try {
          await renderTask.promise;
        } catch (renderErr) {
          if (renderErr?.name !== 'RenderingCancelledException') {
            console.warn(`Render error on page ${pageNum}:`, renderErr);
          }
        }
      }
    } catch (err) {
      console.error('Render all pages error:', err);
    }
  }, []);

  // Main PDF loading effect
  useEffect(() => {
    if (!selectedPdf?.pdf_path) return;

    let isMounted = true;
    setLoading(true);
    setFirstPageReady(false);
    setError(null);
    setScale(1);

    const loadDocument = async () => {
      try {
        const pdfjs = await ensurePdfJsLoaded();
        if (!isMounted) return;

        const pdfUrl = `/api/files/${selectedPdf.pdf_path}`;
        const loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          disableAutoFetch: false,
          disableStream: false,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err) {
        console.error('PDF load failed:', err);
        if (isMounted) {
          setError('Gagal memuat dokumen tutorial. Format PDF mungkin rusak atau koneksi terputus.');
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      cancelRenderTasks();
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy();
        } catch (e) {}
        pdfDocRef.current = null;
      }
    };
  }, [selectedPdf, ensurePdfJsLoaded]);

  // Trigger render when numPages is set or scale changes
  useEffect(() => {
    if (!loading && numPages > 0 && pdfDocRef.current) {
      const raf = requestAnimationFrame(() => {
        renderAllPages(pdfDocRef.current, scale);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [loading, numPages, scale, renderAllPages]);

  // Handle window resize (e.g. smartphone rotation)
  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (pdfDocRef.current && !loading && numPages > 0) {
          renderAllPages(pdfDocRef.current, scale);
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [loading, numPages, scale, renderAllPages]);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(Number((s + 0.2).toFixed(1)), 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(Number((s - 0.2).toFixed(1)), 0.6));
  const handleZoomReset = () => setScale(1);

  if (!selectedPdf) return null;

  return (
    <div
      data-testid="pdf-viewer-modal"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-3 md:p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-5xl h-full sm:h-[95vh] sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - Responsive for Mobile & Desktop */}
        <div className="border-b border-slate-200 bg-white/95 px-3.5 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 flex-shrink-0 z-10 shadow-xs">
          {/* Row 1: Title & Close Button on Mobile */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 flex-shrink-0">
                {selectedPdf.category || 'Tutorial'}
              </span>
              <h3 
                className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate leading-snug" 
                style={{ fontFamily: 'Outfit, sans-serif' }}
                title={selectedPdf.title}
              >
                {selectedPdf.title}
              </h3>
            </div>

            <Button
              data-testid="close-pdf-button"
              onClick={onClose}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:hidden flex-shrink-0 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Row 2 on Mobile / Right side on Desktop: Controls Toolbar */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
            {/* Page Count indicator */}
            {numPages > 0 && (
              <span className="text-[11px] font-medium text-slate-500">
                {numPages} Hal {scale !== 1 && `(${Math.round(scale * 100)}%)`}
              </span>
            )}

            {/* Zoom Controls */}
            {!error && numPages > 0 && (
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-slate-700 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.6}
                  className="p-1 sm:p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Perkecil (-)"
                  aria-label="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="px-1.5 text-[11px] font-semibold text-slate-700 hover:text-brand-600 transition-colors"
                  title="Reset Zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 2.5}
                  className="p-1 sm:p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Perbesar (+)"
                  aria-label="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Download Button */}
            <Button
              data-testid="download-pdf-button"
              onClick={() => onDownload(selectedPdf.pdf_path, selectedPdf.title)}
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs bg-brand-500 text-white hover:bg-brand-600 transition-all rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>

            {/* Close Button on Desktop */}
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Viewer Area - Continuous Vertical Scroll */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-auto bg-slate-100/90 p-2 sm:p-4 md:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading && (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center gap-3 text-slate-500 py-16">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shadow-xs">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Memuat isi tutorial...
              </p>
              <p className="text-xs text-slate-500">
                Menyiapkan halaman agar langsung dapat dibaca
              </p>
            </div>
          )}

          {error && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-center p-6 bg-white rounded-2xl border border-rose-200 max-w-md mx-auto my-10 shadow-xs">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              <h4 className="text-base font-bold text-slate-900">Gagal Membuka Tutorial</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => onDownload(selectedPdf.pdf_path, selectedPdf.title)}
                  className="bg-brand-500 text-white hover:bg-brand-600 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download File PDF
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && numPages > 0 && (
            <div className="flex flex-col items-center gap-3 sm:gap-6 w-full">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div 
                  key={`page-${pageNum}`} 
                  className="flex flex-col items-center w-full max-w-full"
                >
                  {/* Canvas Container */}
                  <div className="relative bg-white rounded-lg sm:rounded-xl shadow-md border border-slate-200/90 overflow-hidden max-w-full min-h-[200px] flex items-center justify-center">
                    <canvas
                      id={`pdf-page-canvas-${pageNum}`}
                      className="block max-w-full h-auto bg-white"
                    />
                  </div>

                  {/* Page Badge */}
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/90 text-[10px] sm:text-[11px] font-semibold text-slate-600">
                    Halaman {pageNum} dari {numPages}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tutorial Review Footer Bar */}
        <div className="border-t border-slate-200 bg-white/95 px-3.5 sm:px-6 py-2.5 sm:py-3 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 z-10">
          <div className="flex items-center gap-2 text-slate-800">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Apakah tutorial ini membantu?
            </span>
          </div>

          {reviewStatus[selectedPdf.id] ? (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 sm:py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {reviewStatus[selectedPdf.id] === 'helpful'
                  ? 'Terima kasih atas tanggapan positif Anda!'
                  : 'Terima kasih, masukan Anda sangat berharga bagi kami!'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={() => onReview(selectedPdf, true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Ya</span>
              </button>
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={() => onReview(selectedPdf, false)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Tidak, beri masukan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
