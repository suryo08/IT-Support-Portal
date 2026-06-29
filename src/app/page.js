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
      <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/">
          <img 
            src="/logo.png" 
            alt="Chitra Paratama" 
            className="h-10 object-contain cursor-pointer"
            style={{ maxWidth: '180px' }}
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

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.05em' }}>
            IT Support Portal
          </h1>
          <div className="h-1.5 w-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-4 shadow-sm"></div>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Input
              data-testid="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik permasalahan device Anda..."
              className="border-2 border-slate-200 focus:border-slate-900 rounded-lg p-4 text-lg w-full shadow-sm pr-12 transition-all duration-200"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            />
            <Button
              data-testid="search-button"
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white hover:bg-green-600 transition-all duration-200"
            >
              {loading ? 'Mencari...' : <Search className="w-5 h-5" />}
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              ✨ Pencarian berbasis AI
            </span>
          </div>
        </form>

        <div className="mb-8 flex items-center gap-3 flex-wrap">
          <Filter className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-semibold text-slate-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Kategori:</span>
          <Button
            data-testid="category-all"
            onClick={() => handleCategoryChange('all')}
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className={selectedCategory === 'all' ? 'bg-green-500 text-white hover:bg-green-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}
          >
            Semua
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              data-testid={`category-${cat}`}
              onClick={() => handleCategoryChange(cat)}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className={selectedCategory === cat ? 'bg-green-500 text-white hover:bg-green-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}
            >
              {cat}
            </Button>
          ))}
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {selectedCategory === 'all' ? 'Semua Tutorial' : `Tutorial ${selectedCategory}`} ({results.length})
            </h2>
            {results.map((result) => (
              <div
                key={result.id}
                data-testid={`search-result-${result.id}`}
                className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <button
                      data-testid={`result-title-${result.id}`}
                      onClick={() => handleOpenPdf(result)}
                      className="text-xl font-semibold text-slate-900 hover:text-green-500 transition-colors duration-200 text-left"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {result.title}
                    </button>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                      {result.category}
                    </p>
                    <p className="text-base leading-relaxed text-slate-700 mt-3" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                      {result.content.substring(0, 200)}{result.content.length > 200 ? '...' : ''}
                    </p>
                    {result.score && result.score > 0 && result.score !== 0.5 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          ✨ AI Match: {(result.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {result.score === 0.5 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          Keyword Match
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  className="bg-green-500 text-white hover:bg-green-600 transition-all duration-200"
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
