'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Headphones, 
  MessageSquarePlus, 
  X, 
  Send, 
  CheckCircle2, 
  BookOpen, 
  Wrench, 
  MessageCircle, 
  Loader2, 
  Phone 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const contacts = [
  { name: 'Aditya Jarangmula N', phone: '62816209911' },
  { name: 'Firmanto S', phone: '628111668978' },
  { name: 'Gilang Suryo W', phone: '6285651152360' },
];

export function FeedbackModal({ isOpen, onClose, initialData = null }) {
  const [category, setCategory] = useState('request_tutorial');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Synchronize state when modal is opened or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategory(initialData.category || 'request_tutorial');
        setTitle(initialData.title || '');
        setMessage(initialData.message || '');
      } else {
        setCategory('request_tutorial');
        setTitle('');
        setMessage('');
      }
      setSubmitted(false);
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !title.trim() || !message.trim()) {
      setError('Mohon isi nama, judul topik, dan detail saran/masukan.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axios.post('/api/feedback', {
        name: name.trim(),
        contact: contact.trim(),
        category,
        title: title.trim(),
        message: message.trim()
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.detail || 'Gagal mengirim saran. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    if (submitted) {
      setName('');
      setContact('');
      setTitle('');
      setMessage('');
      setCategory('request_tutorial');
      setSubmitted(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Saran & Request Tutorial
              </h3>
              <p className="text-xs text-slate-500">
                Bantu kami meningkatkan kualitas layanan IT Portal
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Terima Kasih Atas Masukan Anda!
              </h4>
              <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
                Saran dan masukan Anda telah terkirim ke kotak masuk tim IT Support untuk segera ditindaklanjuti.
              </p>
              <Button
                onClick={handleClose}
                className="bg-brand-500 text-white hover:bg-brand-600 px-6 py-2 rounded-xl"
              >
                Tutup
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {/* Kategori Masukan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Jenis Masukan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('request_tutorial')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === 'request_tutorial'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mb-1 text-brand-500" />
                    <span>Request Tutorial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('improvement')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === 'improvement'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wrench className="w-4 h-4 mb-1 text-amber-500" />
                    <span>Saran Perbaikan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('other')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === 'other'
                        ? 'border-slate-700 bg-slate-100 text-slate-900 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 mb-1 text-slate-500" />
                    <span>Lainnya</span>
                  </button>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="h-10 text-sm border-slate-200 rounded-lg"
                  required
                />
              </div>

              {/* Kontak / Departemen (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Departemen / Kontak (Email / No. HP) <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <Input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Contoh: Finance / budi@chitraparatama.co.id"
                  className="h-10 text-sm border-slate-200 rounded-lg"
                />
              </div>

              {/* Judul Topik */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Judul Topik / Masukan <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === 'request_tutorial'
                      ? 'Contoh: Panduan Setting VPN Kantor di macOS'
                      : 'Contoh: Perbaikan tampilan tombol pencarian'
                  }
                  className="h-10 text-sm border-slate-200 rounded-lg"
                  required
                />
              </div>

              {/* Detail Pesan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detail Saran & Masukan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Jelaskan kebutuhan tutorial yang diinginkan, kendala saat membaca panduan, atau ide perbaikan secara rinci..."
                  rows={4}
                  className="w-full text-sm border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-9 px-4 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 text-xs bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-1.5 font-medium rounded-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Saran</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeaderSupport({ onOpenFeedback }) {
  const [contactOpen, setContactOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setContactOpen(false);
      }
    }
    if (contactOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contactOpen]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {/* 1. Hubungi IT Support with Dropdown Popover */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setContactOpen(!contactOpen)}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-150 cursor-pointer ${
            contactOpen 
              ? 'bg-brand-700 text-white shadow-xs' 
              : 'bg-brand-500 hover:bg-brand-600 text-white shadow-xs active:scale-95'
          }`}
          aria-label="Hubungi IT Support"
          title="Hubungi IT Support via WhatsApp"
        >
          <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden md:inline">Hubungi IT Support</span>
          <span className="md:hidden">IT Support</span>
        </button>

        {contactOpen && (
          <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 sm:p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Hubungi IT Support
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Pilih personil support via WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              {contacts.map((c) => (
                <a
                  key={c.phone}
                  href={`https://wa.me/${c.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-brand-50/80 border border-transparent hover:border-brand-200 transition-all duration-150 group"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                      {c.name}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500">
                      {c.phone.replace(/^62/, '+62 ').replace(/(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Saran & Masukan Button */}
      <button
        type="button"
        onClick={onOpenFeedback}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-600 border border-slate-200 hover:border-brand-200 shadow-xs transition-all active:scale-95 cursor-pointer"
        aria-label="Saran dan Masukan"
        title="Kirim saran dan masukan atau request tutorial"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
        <span className="hidden md:inline">Saran & Masukan</span>
        <span className="md:hidden">Saran</span>
      </button>
    </div>
  );
}

// Default export backward compatibility
export default function SupportButton() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  return (
    <>
      <HeaderSupport onOpenFeedback={() => setFeedbackOpen(true)} />
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
