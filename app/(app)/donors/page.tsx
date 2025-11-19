"use client";
import { useEffect, useState } from 'react';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import { BACKEND_URL } from '@/lib/backend';

interface Donor {
  id: number;
  full_name: string;
  blood_group?: string;
  availability?: boolean;
  pra_score?: number;
  location?: string;
}

export default function DonorsListPage() {
  const { token } = useBackendToken();
  const [data, setData] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/donors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setData(json.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Donors</h1>
      {!token && <p className="text-sm text-red-600">Login to backend to view donors.</p>}
      {loading && <p className="text-sm">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-slate-200 dark:divide-slate-700 mt-4">
        {data.map(d => (
          <li key={d.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{d.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{d.blood_group || '—'} | PRA: {d.pra_score ?? '—'} | {d.location || 'Unknown'}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${d.availability ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100' : 'bg-slate-200 dark:bg-slate-700'}`}>{d.availability ? 'Available' : 'Unavailable'}</span>
          </li>
        ))}
        {data.length === 0 && token && !loading && <li className="py-3 text-sm text-slate-500">No donors found.</li>}
      </ul>
    </div>
  );
}
