"use client";
import { useState } from 'react';
import { useBackendToken } from '@/lib/BackendTokenProvider';

export default function BackendLoginPage() {
  const { token, login, logout } = useBackendToken();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h1 className="text-2xl font-semibold mb-4">Backend API Login</h1>
      {token ? (
        <div className="space-y-4">
          <p className="text-sm break-all">Token: {token}</p>
          <button onClick={logout} className="btn">Logout</button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
          </div>
          <button disabled={loading} className="btn disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      )}
    </div>
  );
}
