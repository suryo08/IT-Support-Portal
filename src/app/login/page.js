'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(user.role) && user.status === 'approved') {
      router.replace('/admin');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.push('/admin');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center mb-4 cursor-pointer">
            <img
              src="/logo.png"
              alt="Fix IT"
              className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,35,83,0.14)]"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Admin Login
          </h1>
          <p className="text-sm text-slate-600" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Akses Panel Admin Fix IT
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
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
                placeholder="admin@itsupport.com"
                className="mt-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
                className="mt-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              />
            </div>

            {error && (
              <div data-testid="login-error" className="text-red-500 text-xs sm:text-sm text-center bg-red-50 border border-red-200 rounded-lg p-2.5">
                {error}
              </div>
            )}

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-white hover:bg-brand-600 transition-all duration-200 py-2.5 text-sm sm:text-base font-semibold rounded-lg cursor-pointer shadow-xs"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Belum punya akun admin?{' '}
              <Link href="/register" className="text-brand-600 hover:text-brand-700 font-semibold">
                Daftar di sini
              </Link>
            </p>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-brand-600 transition-colors duration-200 block mt-2"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              &larr; Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
