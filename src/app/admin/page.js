'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Trash2, LogOut, FileText, Edit, X, TrendingUp, Layers, Clock } from 'lucide-react';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API = '/api';
const MAX_FILE_SIZE_MB = 10;
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
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPdfFile, setEditPdfFile] = useState(null);

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
        setUploadError('Hanya file PDF yang diperbolehkan');
        setPdfFile(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * MB_TO_BYTES) {
        setUploadError(`Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB`);
        setPdfFile(null);
        return;
      }
      setPdfFile(file);
      setUploadError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!title || !category || !content || !pdfFile) {
      setUploadError('Semua field harus diisi');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('content', content);
    formData.append('pdf_file', pdfFile);

    try {
      await axios.post(`${API}/tutorials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadSuccess('Tutorial berhasil ditambahkan!');
      setTitle('');
      setCategory('');
      setContent('');
      setPdfFile(null);
      document.getElementById('pdf-upload').value = '';
      await fetchTutorials();
      await fetchStats();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.detail || 'Upload gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tutorial) => {
    setEditingTutorial(tutorial);
    setEditTitle(tutorial.title);
    setEditCategory(tutorial.category);
    setEditContent(tutorial.content);
    setEditModal(true);
  };

  const handleUpdateTutorial = async () => {
    if (!editTitle || !editCategory || !editContent) {
      alert('Semua field harus diisi');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('category', editCategory);
    formData.append('content', editContent);
    
    if (editPdfFile) {
      formData.append('pdf_file', editPdfFile);
    }

    try {
      await axios.put(`${API}/tutorials/${editingTutorial.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setEditModal(false);
      setEditingTutorial(null);
      setEditPdfFile(null);
      await fetchTutorials();
      await fetchStats();
    } catch (error) {
      console.error('Update error:', error);
      alert('Update gagal: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Chitra Paratama" 
              className="h-10 object-contain"
              style={{ maxWidth: '180px' }}
            />
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Admin Dashboard
            </h1>
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-6">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="bg-white text-slate-900 shadow-sm hover:bg-white font-semibold">
                  Tutorials
                </Button>
              </Link>
              {user?.role === 'super_admin' && (
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium">
                    User Management
                  </Button>
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {user?.email}
            </span>
            <Button
              data-testid="logout-button"
              onClick={handleLogout}
              variant="outline"
              className="border-slate-200 text-slate-900 hover:bg-slate-100 transition-all duration-200"
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
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Total Tutorial</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.total_tutorials}</p>
                </div>
                <div className="bg-green-200 rounded-full p-3">
                  <Layers className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Kategori</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.by_category.length}</p>
                </div>
                <div className="bg-blue-200 rounded-full p-3">
                  <TrendingUp className="w-8 h-8 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
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
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
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
                className="mt-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kategori
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger data-testid="category-select" className="mt-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none">
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
                className="mt-2 w-full border border-slate-200 rounded-md p-3 focus:ring-2 focus:ring-green-400 focus:outline-none"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                required
              />
            </div>

            <div>
              <Label htmlFor="pdf-upload" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Upload PDF
              </Label>
              <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition-all duration-200">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
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
                  className="cursor-pointer text-green-500 hover:text-green-600 font-semibold"
                >
                  Klik untuk upload atau drag & drop
                </label>
                <p className="text-sm text-slate-500 mt-2">PDF maksimal 10MB</p>
                {pdfFile && (
                  <p className="text-sm text-slate-700 mt-4 font-semibold">
                    File: {pdfFile.name}
                  </p>
                )}
              </div>
            </div>

            {uploadError && (
              <div data-testid="upload-error" className="text-red-500 text-sm">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div data-testid="upload-success" className="text-green-600 text-sm">
                {uploadSuccess}
              </div>
            )}

            <Button
              data-testid="submit-tutorial-button"
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white hover:bg-green-600 transition-all duration-200 py-6 text-lg font-semibold"
            >
              {loading ? 'Uploading...' : 'Tambah Tutorial'}
            </Button>
          </form>
        </div>

        {/* Tutorials Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Judul</TableHead>
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
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-slate-900">{tutorial.title}</span>
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
        <DialogContent className="max-w-2xl">
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
                rows={6}
                className="mt-2 w-full border border-slate-200 rounded-md p-3"
              />
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" />
                Update Dokumen PDF
              </Label>
              <p className="text-sm text-slate-600 mt-2 mb-3">
                Upload PDF baru untuk memperbarui dokumen tutorial. File lama akan otomatis terganti.
              </p>
              <div className="mt-2 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition-all duration-200">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setEditPdfFile(e.target.files[0])}
                  className="hidden"
                  id="edit-pdf-upload"
                />
                <label
                  htmlFor="edit-pdf-upload"
                  className="cursor-pointer block"
                >
                  {editPdfFile ? (
                    <div>
                      <div className="text-green-600 font-semibold mb-2 flex items-center justify-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        File Baru Dipilih
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{editPdfFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Ukuran: {(editPdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <svg className="w-12 h-12 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-blue-600 font-semibold text-lg">
                        Klik untuk Upload PDF Baru
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        atau drag & drop file di sini
                      </p>
                      <p className="text-xs text-slate-500 mt-3">
                        PDF maksimal {MAX_FILE_SIZE_MB}MB
                      </p>
                    </div>
                  )}
                </label>
                {editPdfFile && (
                  <button
                    type="button"
                    onClick={() => setEditPdfFile(null)}
                    className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    × Hapus File
                  </button>
                )}
              </div>
              {!editPdfFile && (
                <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Jika tidak upload, PDF lama akan tetap digunakan
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setEditModal(false)}
                variant="outline"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateTutorial}
                disabled={loading}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
