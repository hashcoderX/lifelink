"use client";
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SigninPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    const res = await signIn('credentials', { redirect: false, email, password });
    if (!res || res.error) {
      setError(res?.error || 'Invalid credentials');
      setLoading(false);
      return;
    }
    router.push('/');
    setLoading(false);
  }

  return (
    <div className="container-max py-24">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sign in to your account.</p>
  <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="••••••"
            />
          </div>
          {error && <p className="text-sm text-secondary">{error}</p>}
          {(session as any)?.accessToken && (
            <p className="text-xs text-green-600">Authenticated.</p>
          )}
          <button disabled={loading} className="btn w-full" type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-8 space-y-4">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Continue with Google
          </button>
          
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          No account? <Link href="/signup" className="text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
