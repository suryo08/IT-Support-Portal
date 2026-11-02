'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Upload, 
  Trash2, 
  LogOut, 
  FileText, 
  Edit, 
  X, 
  TrendingUp, 
  Layers, 
  Clock, 
  Users, 
  Loader2, 
  Video, 
  Film, 
  CheckCircle2 
} from 'lucide-react';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminInboxModal from '@/components/AdminInboxModal';

const API = '/api';
const MAX_PDF_SIZE_MB = 2;
const MAX_VIDEO_SIZE_MB = 100;
const MB_TO_BYTES = 1024 * 1024;

const CATEGORIES = [
  'Office 365 Apps',
  'Hardware',
  'Software',
  'Network',
  'Online Meeting'
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tutorials, setTutorials] = useState([]);
  const [filteredTutorials, setFilteredTutorials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Form state (Tambah Tutorial Baru)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // 'uploading' | 'processing' | ''

  // Edit modal state (Edit Tutorial)
  const [editModal, setEditModal] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPdfFile, setEditPdfFile] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [existingVideoPath, setExistingVideoPath] = useState(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editUploadStage, setEditUploadStage] = useState('');

  useEffect(() => {
    fetchTutorials();
    fetchStats();
  }, []);

  useEffect(() => {
    if (categoryFilter === 'all') {
      setFilteredTutorials(tutorials);
    } else {
      setFilteredTutorials(tutorials.filter(t => t.category === categoryFilter));
    }
  }, [categoryFilter, tutorials]);

  const fetchTutorials = async () => {
    try {
      const { data } = await axios.get(`${API}/tutorials`);
      setTutorials(data);
      setFilteredTutorials(data);
    } catch (error) {
      console.error('Fetch tutorials error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/tutorials/stats`);
      setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadError('Hanya file PDF yang diperbolehkan untuk dokumen tutorial');
        setPdfFile(null);
        return;
      }
      if (file.size > MAX_PDF_SIZE_MB * MB_TO_BYTES) {
        setUploadError(`Ukuran file PDF maksimal ${MAX_PDF_SIZE_MB}MB`);
        setPdfFile(null);
        return;
      }
      setPdfFile(file);
      setUploadError('');
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!validTypes.includes(file.type) && !['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
        setUploadError('Hanya format video (MP4, WebM, MOV, MKV) yang diperbolehkan');
        setVideoFile(null);
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_MB * MB_TO_BYTES) {
        setUploadError(`Ukuran file video maksimal ${MAX_VIDEO_SIZE_MB}MB`);
        setVideoFile(null);
        return;
      }
      setVideoFile(file);
      setUploadError('');
    }
  };

  const handleEditVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!validTypes.includes(file.type) && !['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
        alert('Hanya format video (MP4, WebM, MOV, MKV) yang diperbolehkan');
        setEditVideoFile(null);
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_MB * MB_TO_BYTES) {
        alert(`Ukuran file video maksimal ${MAX_VIDEO_SIZE_MB}MB`);
        setEditVideoFile(null);
        return;
      }
      setEditVideoFile(file);
      setRemoveVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!title || !category || !content || !pdfFile) {
      setUploadError('Judul, kategori, deskripsi, dan file PDF wajib diisi');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadStage('uploading');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('content', content);
    formData.append('pdf_file', pdfFile);
    if (videoFile) {
      formData.append('video_file', videoFile);
    }

    try {
      await axios.post(`${API}/tutorials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            if (percent >= 100) {
              setUploadStage('processing');
            }
          }
        }
      });

      setUploadSuccess('Tutorial berhasil ditambahkan!');
      setTitle('');
      setCategory('');
      setContent('');
      setPdfFile(null);
      setVideoFile(null);

      const fileInput = document.getElementById('pdf-upload');
      if (fileInput) fileInput.value = '';
      const videoInput = document.getElementById('video-upload');
      if (videoInput) videoInput.value = '';

      // Concurrently reload tutorials and statistics
      await Promise.all([fetchTutorials(), fetchStats()]);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.detail || 'Upload gagal');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  const handleEdit = (tutorial) => {
    setEditingTutorial(tutorial);
    setEditTitle(tutorial.title);
    setEditCategory(tutorial.category);
    setEditContent(tutorial.content);
    setEditPdfFile(null);
    setEditVideoFile(null);
    setExistingVideoPath(tutorial.video_path || null);
    setRemoveVideo(false);
    setEditModal(true);
  };

  const handleUpdateTutorial = async () => {
    if (!editTitle || !editCategory || !editContent) {
      alert('Semua field utama harus diisi');
      return;
    }

    setLoading(true);
    setEditUploadProgress(0);
    setEditUploadStage((editPdfFile || editVideoFile) ? 'uploading' : 'processing');

    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('category', editCategory);
    formData.append('content', editContent);
    
    if (editPdfFile) {
      formData.append('pdf_file', editPdfFile);
    }
    if (editVideoFile) {
      formData.append('video_file', editVideoFile);
    }
    if (removeVideo) {
      formData.append('remove_video', 'true');
    }

    try {
      await axios.put(`${API}/tutorials/${editingTutorial.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setEditUploadProgress(percent);
            if (percent >= 100) {
              setEditUploadStage('processing');
            }
          }
        }
      });
      setEditModal(false);
      setEditingTutorial(null);
      setEditPdfFile(null);
      setEditVideoFile(null);
      setExistingVideoPath(null);
      setRemoveVideo(false);
      await Promise.all([fetchTutorials(), fetchStats()]);
    } catch (error) {
      console.error('Update error:', error);
      alert('Update gagal: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setLoading(false);
      setEditUploadProgress(0);
      setEditUploadStage('');
    }
  };

  const handleDelete = async (tutorialId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tutorial ini?')) {
      return;
    }

    try {
      await axios.delete(`${API}/tutorials/${tutorialId}`);
      await fetchTutorials();
      await fetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Gagal menghapus tutorial');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center cursor-pointer">
              <img
                src="/logo.png"
                alt="Fix IT"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Admin Dashboard
            </h1>
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-6">
              <Button asChild variant="ghost" size="sm" className="bg-white text-slate-900 shadow-sm hover:bg-white font-semibold">
                <Link href="/admin">
                  Tutorials
                </Link>
              </Button>
              {user?.role === 'super_admin' && (
                <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium">
                  <Link href="/admin/users">
                    User Management
                  </Link>
                </Button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <AdminInboxModal />
            <span className="text-sm text-slate-500 hidden sm:inline" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {user?.email}
            </span>
            <Button
              data-testid="logout-button"
              onClick={handleLogout}
              variant="outline"
              className="border-slate-200 text-slate-900 bg-white hover:bg-slate-100 transition-all duration-200 shadow-xs"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-brand-50/90 to-brand-100/90 border border-brand-200/80 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Total Tutorial</p>
                  <p className="text-3xl font-bold text-brand-900 mt-2">{stats.total_tutorials}</p>
                </div>
                <div className="bg-brand-200 rounded-full p-3">
                  <Layers className="w-8 h-8 text-brand-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/90 to-blue-100/90 border border-blue-200/80 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Kunjungan 7 Hari</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.visits_7_days ?? 0}</p>
                  <p className="text-xs text-blue-700/80 mt-1 font-medium">
                    {(stats.unique_devices_7_days ?? 0)} device unik
                  </p>
                </div>
                <div className="bg-blue-200 rounded-full p-3">
                  <Users className="w-8 h-8 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/90 border border-purple-200/80 rounded-2xl p-6 shadow-xs backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Upload 7 Hari</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.recent_uploads}</p>
                </div>
                <div className="bg-purple-200 rounded-full p-3">
                  <Clock className="w-8 h-8 text-purple-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
          <h2 className="text-xl font-semibold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Tambah Tutorial Baru
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="upload-form">
            <div>
              <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Judul Tutorial
              </Label>
              <Input
                data-testid="title-input"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Cara Reset Password Email"
                className="mt-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-brand-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kategori
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger data-testid="category-select" className="mt-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-brand-400 focus:outline-none">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} data-testid={`category-option-${cat}`}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Deskripsi / Ringkasan
              </Label>
              <textarea
                data-testid="content-textarea"
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ringkasan singkat tentang tutorial ini..."
                rows={4}
                className="mt-2 w-full border border-slate-200 rounded-md p-3 focus:ring-2 focus:ring-brand-400 focus:outline-none"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                required
              />
            </div>

            {/* Upload PDF & Upload Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PDF Upload (Wajib) */}
              <div>
                <Label htmlFor="pdf-upload" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-600" />
                    Upload Dokumen PDF <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">Wajib</span>
                </Label>
                <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50/80 transition-all duration-200 bg-white flex flex-col items-center justify-center min-h-[170px]">
                  <FileText className="w-8 h-8 text-brand-500 mb-2" />
                  <Input
                    data-testid="pdf-upload-input"
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer text-brand-600 hover:text-brand-700 font-semibold text-xs sm:text-sm"
                  >
                    Klik untuk upload PDF
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">PDF maksimal {MAX_PDF_SIZE_MB}MB</p>
                  {pdfFile && (
                    <div className="mt-3 p-2 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800 font-medium truncate flex items-center justify-center gap-1.5 max-w-full">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{pdfFile.name}</span>
                      <span className="text-slate-500 text-[10px]">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Upload (Opsional) */}
              <div>
                <Label htmlFor="video-upload" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-600" />
                    Upload Video Panduan
                  </span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Opsional</span>
                </Label>
                <div className="mt-2 border-2 border-dashed border-purple-200 rounded-xl p-6 text-center hover:bg-purple-50/40 transition-all duration-200 bg-white flex flex-col items-center justify-center min-h-[170px]">
                  <Video className="w-8 h-8 text-purple-500 mb-2" />
                  <Input
                    data-testid="video-upload-input"
                    id="video-upload"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer text-purple-600 hover:text-purple-700 font-semibold text-xs sm:text-sm"
                  >
                    Klik untuk upload Video
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">MP4, WebM, MOV (Maksimal {MAX_VIDEO_SIZE_MB}MB)</p>
                  {videoFile ? (
                    <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 font-medium flex items-center justify-between gap-1.5 w-full max-w-full">
                      <div className="flex items-center gap-1.5 truncate">
                        <Video className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span className="truncate">{videoFile.name}</span>
                        <span className="text-slate-500 text-[10px]">({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          const v = document.getElementById('video-upload');
                          if (v) v.value = '';
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold p-1 hover:bg-white rounded cursor-pointer flex-shrink-0"
                        title="Hapus video"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-2 italic">Sebagai panduan alternatif jika user tidak ingin membaca tutorial</p>
                  )}
                </div>
              </div>
            </div>

            {uploadError && (
              <div data-testid="upload-error" className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div data-testid="upload-success" className="text-brand-600 text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                {uploadSuccess}
              </div>
            )}

            {/* Real-time Upload Progress Bar */}
            {loading && (
              <div className="space-y-2 bg-white p-4 rounded-xl border border-brand-200 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    {uploadStage === 'uploading'
                      ? `Mengunggah berkas (${uploadProgress}%)...`
                      : 'Menyimpan ke Cloud Storage & Indexing AI...'}
                  </span>
                  <span className="text-brand-600 font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-brand-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {uploadStage === 'uploading'
                    ? 'Sedang mengirimkan file dokumen & video ke server...'
                    : 'File berhasil terunggah, sedang memproses penyimpanan cloud dan database...'}
                </p>
              </div>
            )}

            <Button
              data-testid="submit-tutorial-button"
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-white hover:bg-brand-600 transition-all duration-200 py-6 text-lg font-semibold cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {uploadStage === 'uploading' 
                      ? `Mengunggah (${uploadProgress}%)...` 
                      : 'Menyimpan ke Cloud & AI Indexing...'}
                  </span>
                </div>
              ) : (
                'Tambah Tutorial'
              )}
            </Button>
          </form>
        </div>

        {/* Tutorials Table */}
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Daftar Tutorial ({filteredTutorials.length})
            </h2>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter:</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table data-testid="tutorials-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul & Format</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deskripsi</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTutorials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      {categoryFilter === 'all' ? 'Belum ada tutorial. Tambahkan tutorial pertama Anda.' : `Tidak ada tutorial di kategori ${categoryFilter}`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTutorials.map((tutorial) => (
                    <TableRow key={tutorial.id} data-testid={`tutorial-row-${tutorial.id}`}>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                            <span className="font-semibold text-slate-900 leading-snug">{tutorial.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                              <FileText className="w-3 h-3" /> PDF
                            </span>
                            {tutorial.video_path ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                <Video className="w-3 h-3" /> Ada Video
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                                Tanpa Video
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {tutorial.category}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-slate-700">
                        {tutorial.content.substring(0, 80)}{tutorial.content.length > 80 ? '...' : ''}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            data-testid={`edit-button-${tutorial.id}`}
                            onClick={() => handleEdit(tutorial)}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            data-testid={`delete-button-${tutorial.id}`}
                            onClick={() => handleDelete(tutorial.id)}
                            size="sm"
                            className="bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Edit Tutorial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deskripsi</Label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="mt-2 w-full border border-slate-200 rounded-md p-3"
              />
            </div>

            {/* Media Section: PDF & Video side-by-side in Edit Dialog */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4 mt-4">
              {/* Update PDF */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  Dokumen PDF
                </Label>
                <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/70 hover:bg-slate-100/70 transition-all min-h-[160px] flex flex-col justify-center items-center">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          alert('Hanya file PDF yang diperbolehkan');
                          return;
                        }
                        if (file.size > MAX_PDF_SIZE_MB * MB_TO_BYTES) {
                          alert(`Ukuran PDF maksimal ${MAX_PDF_SIZE_MB}MB`);
                          return;
                        }
                        setEditPdfFile(file);
                      }
                    }}
                    className="hidden"
                    id="edit-pdf-upload"
                  />
                  <label htmlFor="edit-pdf-upload" className="cursor-pointer block w-full">
                    {editPdfFile ? (
                      <div>
                        <div className="text-brand-600 font-semibold text-xs flex items-center justify-center gap-1 mb-1">
                          <CheckCircle2 className="w-4 h-4" /> PDF Baru Dipilih
                        </div>
                        <p className="text-xs text-slate-700 font-medium truncate">{editPdfFile.name}</p>
                        <p className="text-[10px] text-slate-400">({(editPdfFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 text-brand-500 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-brand-600">Ganti PDF (Opsional)</p>
                        <p className="text-[10px] text-slate-500 mt-1">Jika tidak diganti, PDF lama tetap dipakai</p>
                      </div>
                    )}
                  </label>
                  {editPdfFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditPdfFile(null);
                        const input = document.getElementById('edit-pdf-upload');
                        if (input) input.value = '';
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                    >
                      Batal ganti PDF
                    </button>
                  )}
                </div>
              </div>

              {/* Update Video */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-purple-600" />
                  Video Panduan (Opsional)
                </Label>
                <div className="mt-2 border-2 border-dashed border-purple-200 rounded-xl p-5 text-center bg-purple-50/30 hover:bg-purple-50/60 transition-all min-h-[160px] flex flex-col justify-center items-center">
                  <Input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    onChange={handleEditVideoChange}
                    className="hidden"
                    id="edit-video-upload"
                  />

                  {editVideoFile ? (
                    <div>
                      <div className="text-purple-700 font-semibold text-xs flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" /> Video Baru Dipilih
                      </div>
                      <p className="text-xs text-slate-700 font-medium truncate">{editVideoFile.name}</p>
                      <p className="text-[10px] text-slate-400">({(editVideoFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditVideoFile(null);
                          const input = document.getElementById('edit-video-upload');
                          if (input) input.value = '';
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Batal ganti video
                      </button>
                    </div>
                  ) : existingVideoPath && !removeVideo ? (
                    <div>
                      <div className="text-purple-700 font-semibold text-xs flex items-center justify-center gap-1 mb-1">
                        <Video className="w-4 h-4 text-purple-600" /> Video Panduan Tersedia
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">Tutorial ini sudah memiliki video.</p>
                      <div className="flex items-center justify-center gap-2">
                        <label
                          htmlFor="edit-video-upload"
                          className="text-xs px-2.5 py-1 bg-white border border-purple-300 text-purple-700 rounded-md font-medium hover:bg-purple-50 cursor-pointer"
                        >
                          Ganti Video
                        </label>
                        <button
                          type="button"
                          onClick={() => setRemoveVideo(true)}
                          className="text-xs px-2.5 py-1 bg-white border border-red-300 text-red-600 rounded-md font-medium hover:bg-red-50 cursor-pointer"
                        >
                          Hapus Video
                        </button>
                      </div>
                    </div>
                  ) : removeVideo ? (
                    <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs font-semibold text-red-600">Video akan dihapus saat disimpan</p>
                      <button
                        type="button"
                        onClick={() => setRemoveVideo(false)}
                        className="mt-1 text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        Batalkan hapus video
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="edit-video-upload" className="cursor-pointer block w-full">
                      <Video className="w-6 h-6 text-purple-500 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-purple-700">Upload Video Panduan</p>
                      <p className="text-[10px] text-slate-500 mt-1">MP4, WebM, MOV (Maksimal {MAX_VIDEO_SIZE_MB}MB)</p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {loading && (editPdfFile || editVideoFile) && (
              <div className="space-y-1.5 bg-brand-50/60 p-3 rounded-lg border border-brand-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                    {editUploadStage === 'uploading'
                      ? `Mengunggah berkas baru (${editUploadProgress}%)...`
                      : 'Memperbarui di Cloud Storage & AI Indexing...'}
                  </span>
                  <span className="text-brand-600 font-bold">{editUploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${editUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setEditModal(false)}
                variant="outline"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateTutorial}
                disabled={loading}
                className="bg-brand-500 text-white hover:bg-brand-600 flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {(editPdfFile || editVideoFile) && editUploadStage === 'uploading'
                        ? `Mengunggah (${editUploadProgress}%)...`
                        : 'Menyimpan...'}
                    </span>
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminDashboardPage = () => {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
};

export default AdminDashboardPage;
