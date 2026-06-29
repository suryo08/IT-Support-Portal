'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div data-testid="loading-spinner" className="min-h-screen flex items-center justify-center">
        <div className="text-slate-700">Loading...</div>
      </div>
    );
  }

  if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
    return null; // Return null while redirecting
  }

  return children;
};

export default ProtectedRoute;
