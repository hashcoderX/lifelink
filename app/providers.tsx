"use client";
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { BackendTokenProvider } from '@/lib/BackendTokenProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Always wrap in SessionProvider so useSession is available during hydration
  return (
    <SessionProvider>
      <BackendTokenProvider>
        {children}
      </BackendTokenProvider>
    </SessionProvider>
  );
}
