'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Inbox, 
  X, 
  Check, 
  Trash2, 
  RefreshCw, 
  BookOpen, 
  Wrench, 
  MessageCircle, 
  Clock, 
  User, 
  Mail, 
  CheckCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminInboxModal = () => {
  const [open, setOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'request_tutorial' | 'improvement'

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/feedback');
      setFeedbacks(data.feedbacks || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    // Poll unread count every 60 seconds
    const interval = setInterval(fetchFeedbacks, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'unread' ? 'read' : 'unread';
    try {
      await axios.patch(`/api/feedback/${id}`, { status: newStatus });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
      );
      setUnreadCount((prev) => (newStatus === 'read' ? Math.max(0, prev - 1) : prev + 1));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
    try {
      await axios.delete(`/api/feedback/${id}`);
      const deletedItem = feedbacks.find((f) => f.id === id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      if (deletedItem?.status === 'unread') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filter === 'unread') return f.status === 'unread';
    if (filter === 'request_tutorial') return f.category === 'request_tutorial';
    if (filter === 'improvement') return f.category === 'improvement';
    return true;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <>
      {/* Inbox Trigger Button in Admin Header */}
      <button
        data-testid="admin-inbox-button"
        onClick={() => {
          setOpen(true);
          fetchFeedbacks();
        }}
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-brand-600 hover:bg-slate-50 transition-all text-xs font-medium"
        title="Kotak Masuk Saran & Request"
      >
        <Inbox className="w-4 h-4 text-slate-600" />
        <span className="hidden sm:inline">Kotak Masuk</span>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full min-w-[18px] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Modal Dialog */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Kotak Masuk Saran & Request
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-500 text-white rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Saran perbaikan dan permintaan tutorial dari pengguna portal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchFeedbacks}
                  disabled={loading}
                  title="Refresh"
                  className="h-8 w-8 text-slate-500 hover:text-slate-800"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto flex-shrink-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua ({feedbacks.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === 'unread'
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Belum Dibaca
                {unreadCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'unread' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700 font-bold'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('request_tutorial')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'request_tutorial'
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Request Tutorial
              </button>
              <button
                onClick={() => setFilter('improvement')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'improvement'
                    ? 'bg-amber-500 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Saran Perbaikan
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
              {filteredFeedbacks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Inbox className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Tidak ada pesan di kategori ini</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Saran atau request tutorial dari user akan muncul di sini.
                  </p>
                </div>
              ) : (
                filteredFeedbacks.map((item) => {
                  const isUnread = item.status === 'unread';
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all duration-150 ${
                        isUnread
                          ? 'bg-white border-brand-300 shadow-sm ring-1 ring-brand-100'
                          : 'bg-white/80 border-slate-200'
                      }`}
                    >
                      {/* Top bar: Category + Status + Date */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          {item.category === 'request_tutorial' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                              <BookOpen className="w-3 h-3" />
                              Request Tutorial
                            </span>
                          ) : item.category === 'improvement' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Wrench className="w-3 h-3" />
                              Saran Perbaikan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <MessageCircle className="w-3 h-3" />
                              Lainnya
                            </span>
                          )}

                          {isUnread && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              Baru
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-bold text-slate-900 mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {item.title}
                      </h4>

                      {/* Message Content */}
                      <div className="bg-slate-50/80 rounded-lg p-3 text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100 mb-3">
                        {item.message}
                      </div>

                      {/* Sender Details & Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {item.name}
                          </span>
                          {item.contact && (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {item.contact}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              isUnread
                                ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={isUnread ? 'Tandai sudah dibaca' : 'Tandai belum dibaca'}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>{isUnread ? 'Tandai Dibaca' : 'Belum Dibaca'}</span>
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus pesan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminInboxModal;
