'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { CircularProgress } from '@mui/material';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <CircularProgress sx={{ color: '#4f8ef7' }} />
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
