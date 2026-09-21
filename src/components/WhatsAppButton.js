'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
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

const contacts = [
  { name: 'Aditya Jarangmula N', phone: '62816209911' },
  { name: 'Firmanto S', phone: '628111668978' },
  { name: 'Gilang Suryo W', phone: '6285651152360' },
];

const SupportButton = () => {
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Hanya tampil di halaman utama ('/')
  if (pathname !== '/') {
    return null;
  }

  // Feedback form state
  const [category, setCategory] = useState('request_tutorial'); // 'request_tutorial' | 'improvement' | 'other'
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleOpenFeedback = () => {
    setContactOpen(false);
    setFeedbackOpen(true);
    setSubmitted(false);
    setError('');
  };

  const handleCloseFeedback = () => {
    setFeedbackOpen(false);
    if (submitted) {
      setName('');
      setContact('');
      setTitle('');
      setMessage('');
      setCategory('request_tutorial');
      setSubmitted(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
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

  return (
    <>
      {/* Floating Action Buttons Container */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        
        {/* Contact List Popover */}
        {contactOpen && (
          <div className="mb-1 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-80 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Hubungi IT Support
                  </p>
                  <p className="text-[11px] text-slate-500">Pilih personil support via WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setContactOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {contacts.map((c) => (
                <a
                  key={c.phone}
                  href={`https://wa.me/${c.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50/80 border border-transparent hover:border-brand-200 transition-all duration-150 group"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                      {c.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {c.phone.replace(/^62/, '+62 ').replace(/(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 1. Button "Hubungi IT Support" with explicit CTA text */}
        <button
          onClick={() => setContactOpen(!contactOpen)}
          className="w-[205px] h-11 flex items-center gap-2.5 px-3.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group border border-brand-400/30"
          aria-label="Hubungi IT Support"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Hubungi IT Support
          </span>
        </button>

        {/* 2. Button "Saran / Masukan" located below "Hubungi IT Support" */}
        <button
          onClick={handleOpenFeedback}
          className="w-[205px] h-11 flex items-center gap-2.5 px-3.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 hover:text-brand-600 rounded-full shadow-lg hover:shadow-xl border border-slate-200 hover:border-brand-200 transition-all duration-200 group"
          aria-label="Saran dan Masukan"
        >
          <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <MessageSquarePlus className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-slate-700 group-hover:text-brand-600 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Saran & Masukan
          </span>
        </button>

      </div>

      {/* Pop-up Modal Saran & Masukan */}
      {feedbackOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={handleCloseFeedback}
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
                onClick={handleCloseFeedback}
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
                    Saran dan request tutorial Anda telah terkirim ke kotak masuk tim IT Support untuk segera ditindaklanjuti.
                  </p>
                  <Button
                    onClick={handleCloseFeedback}
                    className="bg-brand-500 text-white hover:bg-brand-600 px-6 py-2 rounded-xl"
                  >
                    Tutup
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
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
                      Judul Topik / Request <span className="text-rose-500">*</span>
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
                      placeholder="Jelaskan kebutuhan tutorial yang diinginkan, masalah yang dihadapi, atau ide perbaikan sistem secara rinci..."
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
                      onClick={handleCloseFeedback}
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
      )}
    </>
  );
};

export default SupportButton;
