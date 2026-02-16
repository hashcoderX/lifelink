"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { backendRegister } from '@/lib/backend';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import Link from 'next/link';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setToken } = useBackendToken();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
  const name = fd.get('name') as string;
  const email = fd.get('email') as string;
  const password = fd.get('password') as string;
  const userRole = fd.get('userRole') as string;
    // Client-side password length alignment with backend (min 8)
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    try {
      // Register directly against Laravel backend (authoritative user store)
      try {
        const be = await backendRegister(name || email.split('@')[0], email, password, userRole);
        setToken(be.token);
      } catch (beErr: any) {
        setError(`Backend registration failed: ${beErr.message}`);
        setLoading(false);
        return; // Stop before signIn so user can retry
      }

      await signIn('credentials', { email, password, callbackUrl: '/' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-max py-24">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Create account</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sign up to join LifeLink.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              name="name"
              type="text"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sign up as *</label>
            <select
              name="userRole"
              required
              defaultValue="DONOR"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="DOCTOR">Doctor</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="PATIENT">Patient</option>
              <option value="DONOR">Donor</option>
              <option value="FUND_RAISER">Fund Raiser</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password *</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="At least 8 characters"
            />
          </div>
          {error && <p className="text-sm text-secondary">{error}</p>}
          <button disabled={loading} className="btn w-full" type="submit">
            {loading ? 'Creating...' : 'Sign Up'}
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
          Already have an account? <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
