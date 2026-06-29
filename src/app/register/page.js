'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const AdminRegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      alert('Registrasi berhasil! Akun Anda menunggu persetujuan dari administrator. Anda akan menerima notifikasi via email setelah disetujui.');
      router.push('/login');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img 
              src="/logo.png" 
              alt="Chitra Paratama" 
              className="h-12 object-contain mx-auto mb-6 cursor-pointer"
              style={{ maxWidth: '200px' }}
            />
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Registrasi Admin
          </h1>
          <p className="text-base leading-relaxed text-slate-700" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Portal IT Support - Buat Akun Admin Baru
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
          <div>
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Nama Lengkap
            </Label>
            <Input
              data-testid="name-input"
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="mt-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Email
            </Label>
            <Input
              data-testid="email-input"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              className="mt-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Password
            </Label>
            <Input
              data-testid="password-input"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
              minLength={8}
            />
            <p className="text-xs text-slate-500 mt-1">Minimal 8 karakter</p>
          </div>

          {error && (
            <div data-testid="register-error" className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            data-testid="register-submit-button"
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white hover:bg-green-600 transition-all duration-200 py-6 text-lg font-semibold"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {loading ? 'Loading...' : 'Daftar'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-slate-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-green-500 hover:text-green-600 font-semibold">
              Login di sini
            </Link>
          </p>
          <Link
            href="/"
            className="text-sm text-slate-700 hover:text-green-500 transition-colors duration-200 block"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
