'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  FileText, 
  Download, 
  X, 
  Settings, 
  ThumbsUp, 
  HelpCircle, 
  CheckCircle2, 
  MessageSquarePlus,
  LayoutGrid,
  AppWindow,
  Cpu,
  Boxes,
  Wifi,
  Video,
  Tag,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { HeaderSupport, FeedbackModal } from '@/components/WhatsAppButton';
import PdfViewerModal from '@/components/PdfViewerModal';

const API = '/api';
const ITEMS_PER_PAGE = 8;

const PublicSearchPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [allTutorials, setAllTutorials] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Feedback modal & tutorial review state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackInitialData, setFeedbackInitialData] = useState(null);
  const [reviewStatus, setReviewStatus] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Modal pilihan format (Video vs PDF) saat membuka tutorial yang memiliki video
  const [choiceTutorial, setChoiceTutorial] = useState(null);

  useEffect(() => {
    fetchAllTutorials();

    // Pre-warm PDF.js engine in the background when idle so tutorial opens instantaneously
    const warmUpPdfEngine = () => {
      if (typeof window === 'undefined') return;
      if (!window.pdfjsLib && !document.getElementById('pdfjs-min-script')) {
        const script = document.createElement('script');
        script.id = 'pdfjs-min-script';
        script.src = '/pdfjs/pdf.min.js';
        script.async = true;
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
          }
        };
        document.head.appendChild(script);
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(warmUpPdfEngine);
    } else {
      setTimeout(warmUpPdfEngine, 1200);
    }
  }, []);

  const handlePrefetch = (pdfPath) => {
    if (!pdfPath || typeof window === 'undefined') return;
    try {
      fetch(`/api/files/${pdfPath}`, { priority: 'low' }).catch(() => {});
    } catch (e) {}
  };

  const fetchAllTutorials = async () => {
    try {
      const { data } = await axios.get(`${API}/tutorials`);
      setAllTutorials(data);
      const uniqueCategories = [...new Set(data.map(t => t.category))];
      setCategories(uniqueCategories.sort());
      
      // Show all tutorials by default
      setResults(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Fetch tutorials error:', error);
    }
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/search`, {
        query: query.trim(),
        limit: 50
      });
      
      let filteredResults = data;
      if (selectedCategory !== 'all') {
        filteredResults = data.filter(r => r.category === selectedCategory);
      }
      
      setResults(filteredResults);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search error:', error);
      alert('Pencarian gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setQuery('');
    setCurrentPage(1);
    
    if (category === 'all') {
      setResults(allTutorials);
    } else {
      const filtered = allTutorials.filter(t => t.category === category);
      setResults(filtered);
    }
  };

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat === 'all') return LayoutGrid;
    if (cat.includes('office') || cat.includes('365') || cat.includes('app')) return AppWindow;
    if (cat.includes('hardware') || cat.includes('perangkat')) return Cpu;
    if (cat.includes('software') || cat.includes('aplikasi')) return Boxes;
    if (cat.includes('network') || cat.includes('jaringan') || cat.includes('wifi') || cat.includes('internet')) return Wifi;
    if (cat.includes('meeting') || cat.includes('video') || cat.includes('zoom') || cat.includes('teams')) return Video;
    return Tag;
  };

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    const element = document.getElementById('tutorials-heading');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleOpenPdf = (result, initialTab = 'pdf') => {
    setSelectedPdf({ ...result, initialTab });
  };

  const handleTutorialClick = (tutorial) => {
    if (tutorial?.video_path) {
      setChoiceTutorial(tutorial);
    } else {
      handleOpenPdf(tutorial, 'pdf');
    }
  };

  const handleClosePdf = () => {
    setSelectedPdf(null);
  };

  const handleDownloadFile = async (filePath, title, isVideo = false) => {
    try {
      const response = await axios.get(`${API}/files/${filePath}`, {
        responseType: 'blob'
      });
      const ext = filePath.split('.').pop() || (isVideo ? 'mp4' : 'pdf');
      const filename = isVideo ? `${title} (Video).${ext}` : `${title}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Download gagal. Silakan coba lagi.');
    }
  };

  const handleOpenFeedback = (initialData = null) => {
    setFeedbackInitialData(initialData);
    setFeedbackModalOpen(true);
  };

  const handleReviewTutorial = async (tutorial, isHelpful) => {
    if (!tutorial?.id || reviewSubmitting) return;

    setReviewSubmitting(true);
    try {
      await axios.post(`${API}/tutorials/${tutorial.id}/review`, {
        helpful: isHelpful
      });
      setReviewStatus(prev => ({
        ...prev,
        [tutorial.id]: isHelpful ? 'helpful' : 'feedback'
      }));
    } catch (err) {
      console.error('Review submission error:', err);
    } finally {
      setReviewSubmitting(false);
    }

    if (!isHelpful) {
      handleOpenFeedback({
        category: 'improvement',
        title: `Masukan untuk tutorial: ${tutorial.title}`,
        message: `Halo Tim IT Support, mengenai tutorial "${tutorial.title}":\n`
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Header with Logo, Support buttons & Admin Access */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-2">
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src="/ChitraParatama_Logo_OnWhite_Color_Primary.png"
            alt="PT. Chitra Paratama"
            className="h-7 sm:h-8 md:h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Header Support & Feedback Buttons */}
          <HeaderSupport onOpenFeedback={() => handleOpenFeedback(null)} />

          <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden xs:block" />

          {!authLoading && (
            user && ['admin', 'super_admin'].includes(user.role) && user.status === 'approved' ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 bg-white/90 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-xs"
                >
                  <span className="hidden sm:inline">Dashboard Admin</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
                {user.role === 'super_admin' && (
                  <Link
                    href="/admin/users"
                    className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 bg-white/90 hover:bg-slate-50 transition-colors whitespace-nowrap hidden md:inline-flex shadow-xs"
                  >
                    User Management
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                data-testid="admin-login-icon"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center flex-shrink-0"
                title="Admin Login"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            )
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="text-center mb-6 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Fix IT"
            className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,35,83,0.14)]"
          />
          <div className="mt-2.5 text-center">
            <p className="text-base sm:text-lg md:text-xl font-semibold tracking-wide text-brand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your Guide to <span className="text-brand-500">Solving IT Problems</span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-300"></div>
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-300"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative group">
            {/* Ambient Search Bar Aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-400/25 via-sky-300/30 to-brand-500/25 rounded-2xl blur-md opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 group-focus-within:blur-lg transition-all duration-300 pointer-events-none" />
            <div className="relative">
              <Input
                data-testid="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik permasalahan device Anda..."
                className="bg-white/95 backdrop-blur-sm border border-slate-300/85 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl h-11 py-2.5 pl-4 pr-12 text-sm md:text-base w-full shadow-[0_4px_16px_-4px_rgba(0,106,199,0.08)] transition-all duration-200"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
              />
              <Button
                data-testid="search-button"
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-brand-500 text-white hover:bg-brand-600 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
              >
                {loading ? '...' : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-brand-600 font-semibold bg-brand-50/90 border border-brand-200/60 px-2 py-0.5 rounded text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Smart Search
            </span>
          </div>
        </form>

        <div className="mb-8 flex items-center justify-center gap-2 flex-wrap">
          {(() => {
            const AllIcon = getCategoryIcon('all');
            return (
              <Button
                data-testid="category-all"
                onClick={() => handleCategoryChange('all')}
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                className={`h-8 px-3.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-brand-500 text-white shadow-xs hover:bg-brand-600 border border-brand-500'
                    : 'border-slate-200/90 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                }`}
              >
                <AllIcon className="w-3.5 h-3.5" />
                <span>Semua</span>
              </Button>
            );
          })()}
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat);
            return (
              <Button
                key={cat}
                data-testid={`category-${cat}`}
                onClick={() => handleCategoryChange(cat)}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className={`h-8 px-3.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow-xs hover:bg-brand-600 border border-brand-500'
                    : 'border-slate-200/90 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat}</span>
              </Button>
            );
          })}
        </div>

        {results.length > 0 && (
          <div>
            <div id="tutorials-heading" className="scroll-mt-4 flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {selectedCategory === 'all' ? 'Semua Tutorial' : `Tutorial ${selectedCategory}`} ({results.length})
              </h2>
              {totalPages > 1 && (
                <span className="text-xs text-slate-500 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedResults.map((result) => (
                <div
                  key={result.id}
                  data-testid={`search-result-${result.id}`}
                  className="relative border border-slate-200/90 rounded-2xl p-4 md:p-5 hover:border-brand-400/90 bg-white/95 backdrop-blur-xs flex flex-col justify-between group cursor-pointer shadow-[0_2px_12px_-2px_rgba(15,23,42,0.05),0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_-6px_rgba(0,106,199,0.14)] hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                  onMouseEnter={() => handlePrefetch(result.pdf_path)}
                  onTouchStart={() => handlePrefetch(result.pdf_path)}
                  onClick={() => handleTutorialClick(result)}
                >
                  {/* Subtle Top Gradient Accent on Hover */}
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400/0 to-transparent group-hover:via-brand-500 transition-all duration-300" />

                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                        <button
                          data-testid={`result-title-${result.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTutorialClick(result);
                          }}
                          className="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors duration-200 text-left line-clamp-2 leading-snug"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                          title={result.title}
                        >
                          {result.title}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {result.video_path && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Video className="w-3 h-3" />
                            <span>Ada Video</span>
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-brand-50 text-brand-700 border border-brand-200/70 flex-shrink-0">
                          {result.category}
                        </span>
                      </div>
                    </div>
                    <p
                      className="text-xs md:text-sm leading-relaxed text-slate-600 line-clamp-2 mt-2"
                      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                      title={result.content}
                    >
                      {result.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {result.score && result.score > 0 && result.score !== 0.5 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-semibold bg-brand-100 text-brand-800 border border-brand-200">
                          ✨ AI Match: {(result.score * 100).toFixed(0)}%
                        </span>
                      )}
                      {result.score === 0.5 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          Keyword Match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {result.video_path ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPdf(result, 'video');
                            }}
                            className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Tonton Video Panduan Tutorial Langsung"
                          >
                            <Play className="w-3 h-3 fill-amber-700 text-amber-700" />
                            <span>Video</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPdf(result, 'pdf');
                            }}
                            className="text-xs font-medium text-slate-700 hover:text-brand-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Buka Dokumen PDF"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>PDF</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-brand-600 group-hover:text-brand-700 inline-flex items-center gap-0.5">
                          Buka Dokumen &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan <span className="font-semibold text-slate-700">{startIndex + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(startIndex + ITEMS_PER_PAGE, results.length)}</span> dari <span className="font-semibold text-slate-700">{results.length}</span> tutorial
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </Button>

                  {getPageNumbers().map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400 select-none">…</span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => handlePageChange(p)}
                        className={`h-8 min-w-[32px] px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          currentPage === p
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Tidak ada tutorial ditemukan.
            </p>
          </div>
        )}
      </div>

      {/* Modal Pilihan Format Panduan (PDF vs Video) saat user membuka tutorial yang memiliki video */}
      {choiceTutorial && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setChoiceTutorial(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-1.5">
                  {choiceTutorial.category || 'Tutorial'}
                </span>
                <h3 
                  className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2" 
                  style={{ fontFamily: 'Outfit, sans-serif' }} 
                  title={choiceTutorial.title}
                >
                  {choiceTutorial.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tutorial ini memiliki 2 opsi panduan. Pilih cara belajar yang Anda sukai:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChoiceTutorial(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Opsi 1: Video Panduan (Opsional) */}
              <button
                type="button"
                onClick={() => {
                  const tut = choiceTutorial;
                  setChoiceTutorial(null);
                  handleOpenPdf(tut, 'video');
                }}
                className="group relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border-2 border-amber-300 bg-linear-to-r from-amber-50/80 to-orange-50/40 hover:from-amber-100 hover:to-orange-100/70 hover:border-amber-500 transition-all text-left shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-amber-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Tonton Video Panduan
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                      OPSIONAL
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-snug">
                    Simak demonstrasi visual langsung langkah demi langkah.
                  </p>
                </div>
              </button>

              {/* Opsi 2: Dokumen PDF */}
              <button
                type="button"
                onClick={() => {
                  const tut = choiceTutorial;
                  setChoiceTutorial(null);
                  handleOpenPdf(tut, 'pdf');
                }}
                className="group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-brand-300 transition-all text-left shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-200/60 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-brand-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Baca Dokumen PDF
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                    Panduan tertulis terperinci lengkap dengan tangkapan layar.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400 text-center">
              <span>💡 Anda tetap dapat beralih antara PDF dan Video kapan saja di dalam viewer.</span>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated PDF & Video Tutorial Viewer Modal (Renders natively on Canvas / HTML5 Video) */}
      <PdfViewerModal
        selectedPdf={selectedPdf}
        onClose={handleClosePdf}
        onDownload={handleDownloadFile}
        reviewStatus={reviewStatus}
        reviewSubmitting={reviewSubmitting}
        onReview={handleReviewTutorial}
      />

      {/* Modal Saran & Masukan */}
      <FeedbackModal 
        isOpen={feedbackModalOpen} 
        onClose={() => setFeedbackModalOpen(false)} 
        initialData={feedbackInitialData}
      />
    </div>
  );
};

export default PublicSearchPage;
