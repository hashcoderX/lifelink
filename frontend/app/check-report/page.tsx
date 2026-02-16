"use client";
import React from 'react';

export default function CheckReportPage() {
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [score, setScore] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setScore(null);
    if (!file) {
      setFileUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setLoading(true);
    computeBrightnessScore(url)
      .then((s) => setScore(s))
      .catch(() => setError('Could not analyze image'))
      .finally(() => setLoading(false));
  };

  return (
    <main className="container-max py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Check Health Report (Free)</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Upload a face photo to get a quick experimental wellness estimate.</p>

        <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Face Photo</label>
          <input type="file" accept="image/*" onChange={onFileChange} className="mt-2" />

          <div className="mt-6 flex items-center gap-6">
            <div className="h-28 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {fileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">No photo</div>
              )}
            </div>

            <div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Estimated Health Score</div>
              <div className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{loading ? '…' : score != null ? `${score}%` : '--'}</div>
              {score != null && (
                <div className="mt-2 text-sm">
                  <span className={score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'}>
                    {score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'Needs Attention'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">This is an experimental visual heuristic and not a medical report.</p>
        </div>
      </div>
    </main>
  );
}

async function computeBrightnessScore(url: string): Promise<number> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('load error'));
  });
  const dim = 64;
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 50;
  ctx.drawImage(img, 0, 0, dim, dim);
  const data = ctx.getImageData(0, 0, dim, dim).data;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    total += y;
  }
  const avg = total / (dim * dim);
  const pct = Math.round(30 + (avg / 255) * 65);
  return Math.max(0, Math.min(100, pct));
}
