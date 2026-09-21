'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileText, Download, X, Filter, Settings } from 'lucide-react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const API = '/api';

const PublicSearchPage = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [allTutorials, setAllTutorials] = useState([]);

  useEffect(() => {
    fetchAllTutorials();
  }, []);

  const fetchAllTutorials = async () => {
    try {
      const { data } = await axios.get(`${API}/tutorials`);
      setAllTutorials(data);
      const uniqueCategories = [...new Set(data.map(t => t.category))];
      setCategories(uniqueCategories.sort());
      
      // Show all tutorials by default
      setResults(data);
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
    
    if (category === 'all') {
      setResults(allTutorials);
    } else {
      const filtered = allTutorials.filter(t => t.category === category);
      setResults(filtered);
    }
  };

  const handleOpenPdf = (result) => {
    setSelectedPdf(result);
  };

  const handleClosePdf = () => {
    setSelectedPdf(null);
  };

  const handleDownloadPdf = async (pdfPath, title) => {
    try {
      const response = await axios.get(`${API}/files/${pdfPath}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Download gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img
            src="/ChitraParatama_Logo_OnWhite_Color_Primary.png"
            alt="PT. Chitra Paratama"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </Link>
        {user && ['admin', 'super_admin'].includes(user.role) && user.status === 'approved' ? (
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Dashboard Admin
              </Button>
            </Link>
            {user.role === 'super_admin' && (
              <Link href="/admin/users">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  User Management
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button
              data-testid="admin-login-icon"
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
              title="Admin Login"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Fix IT"
            className="h-36 md:h-44 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,35,83,0.18)]"
          />
          <div className="mt-3 text-center">
            <p className="text-xl md:text-2xl font-semibold tracking-wide text-brand-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your Guide to <span className="text-brand-500">Solving IT Problems</span>
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-brand-300"></div>
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-brand-300"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Input
              data-testid="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik permasalahan device Anda..."
              className="border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg h-11 py-2.5 pl-4 pr-12 text-sm md:text-base w-full shadow-xs transition-all duration-200"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            />
            <Button
              data-testid="search-button"
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-brand-500 text-white hover:bg-brand-600 rounded-md flex items-center justify-center transition-all duration-200"
            >
              {loading ? '...' : <Search className="w-4 h-4" />}
            </Button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Pencarian Berbasis AI
            </span>
          </div>
        </form>

        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Kategori:</span>
          <Button
            data-testid="category-all"
            onClick={() => handleCategoryChange('all')}
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            className={`h-7 px-2.5 text-xs rounded-md ${selectedCategory === 'all' ? 'bg-brand-500 text-white hover:bg-brand-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Semua
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              data-testid={`category-${cat}`}
              onClick={() => handleCategoryChange(cat)}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              className={`h-7 px-2.5 text-xs rounded-md ${selectedCategory === cat ? 'bg-brand-500 text-white hover:bg-brand-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {selectedCategory === 'all' ? 'Semua Tutorial' : `Tutorial ${selectedCategory}`} ({results.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  data-testid={`search-result-${result.id}`}
                  className="border border-slate-200 rounded-xl p-4 md:p-5 hover:border-brand-300 hover:shadow-md hover:bg-slate-50/60 transition-all duration-200 bg-white flex flex-col justify-between group cursor-pointer"
                  onClick={() => handleOpenPdf(result)}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                        <button
                          data-testid={`result-title-${result.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPdf(result);
                          }}
                          className="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors duration-200 text-left line-clamp-2 leading-snug"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                          title={result.title}
                        >
                          {result.title}
                        </button>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-brand-50 text-brand-700 border border-brand-200/70 flex-shrink-0">
                        {result.category}
                      </span>
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
                    <span className="text-xs font-medium text-brand-600 group-hover:text-brand-700 inline-flex items-center gap-0.5 ml-auto">
                      Buka PDF &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
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

      {selectedPdf && (
        <div
          data-testid="pdf-viewer-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleClosePdf}
        >
          <div
            className="bg-white rounded-lg w-full max-w-7xl h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 p-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {selectedPdf.title}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  data-testid="download-pdf-button"
                  onClick={() => handleDownloadPdf(selectedPdf.pdf_path, selectedPdf.title)}
                  className="bg-brand-500 text-white hover:bg-brand-600 transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  data-testid="close-pdf-button"
                  onClick={handleClosePdf}
                  variant="outline"
                  className="border-slate-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <iframe
                data-testid="pdf-iframe"
                src={`${API}/files/${selectedPdf.pdf_path}`}
                className="w-full h-full border-0 rounded-lg shadow-lg"
                title={selectedPdf.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSearchPage;
