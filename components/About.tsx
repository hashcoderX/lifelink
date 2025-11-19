"use client";
import React from 'react';
import { useInView } from '../lib/useInView';

export default function About() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="about" ref={ref} className="container-max py-20">
      <div className={`max-w-3xl transition-opacity duration-700 ${inView ? 'animate-fadeInUp opacity-100' : 'opacity-0'}`}>
        <div className="mb-8 rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20 dark:bg-primary/15 dark:ring-primary/30">
          <p className="text-base md:text-lg leading-relaxed text-slate-800 dark:text-slate-100">
            <span className="font-semibold text-primary">LifeLink</span> is a Sri Lankan AI healthcare startup dedicated to{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">revolutionizing organ transplant matching</span>.
            {' '}We combine medical science with artificial intelligence to <span className="font-semibold">save lives</span>.
          </p>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Our Mission</h2>
        <p className="mt-6 text-slate-600 leading-relaxed dark:text-slate-300">
          We believe in saving lives through technology. LifeLink bridges the gap between donors and patients using secure, data-driven algorithms.
        </p>

      </div>
      {/* Full-width card below mission */}
      <div className={`mt-12 transition-opacity duration-700 ${inView ? 'animate-fadeInUp opacity-100' : 'opacity-0'}`}>
        <div className="rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/60 dark:ring-slate-700">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">BMI & Health Score</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Quick self-check tools. For informational purposes only — not a medical diagnosis.</p>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">BMI Calculator</h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Body Mass Index helps assess healthy weight relative to height.</p>
              <BMIForm />
            </div>
            <div>
              <HealthScoreCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BMIForm() {
  const [heightCm, setHeightCm] = React.useState<string>('');
  const [weightKg, setWeightKg] = React.useState<string>('');

  const height = parseFloat(heightCm);
  const weight = parseFloat(weightKg);
  const bmi = React.useMemo(() => {
    if (!height || !weight || height <= 0 || weight <= 0) return null;
    const meters = height / 100;
    return +(weight / (meters * meters)).toFixed(2);
  }, [height, weight]);

  const category = React.useMemo(() => {
    if (bmi == null) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obesity';
  }, [bmi]);

  const categoryColor = React.useMemo(() => {
    if (bmi == null) return 'text-slate-600 dark:text-slate-300';
    if (bmi < 18.5) return 'text-amber-600 dark:text-amber-400';
    if (bmi < 25) return 'text-emerald-600 dark:text-emerald-400';
    if (bmi < 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-rose-600 dark:text-rose-400';
  }, [bmi]);

  const reset = () => {
    setHeightCm('');
    setWeightKg('');
  };

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="e.g., 170"
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
        />
      </div>
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="e.g., 65"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
        />
      </div>
      <div className="md:col-span-1 flex flex-col justify-end">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-300">Your BMI</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{bmi ?? '--'}</div>
          <div className={`mt-1 text-sm font-medium ${categoryColor}`}>{category || 'Enter height and weight'}</div>
        </div>
      </div>

      <div className="md:col-span-3 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Reset
        </button>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Formula: BMI = weight(kg) / (height(m))² • Healthy range: 18.5–24.9
        </div>
      </div>
    </div>
  );
}

function HealthScoreCard() {
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
    // Compute a simple visual score from brightness as a placeholder
    computeBrightnessScore(url).then(setScore).catch(() => setError('Could not analyze image')).finally(() => setLoading(false));
    setLoading(true);
  };

  return (
    <div className="rounded-2xl bg-slate-50/60 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Health Score (Photo)</h4>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Upload a face photo to estimate a simple wellness score. Experimental only.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Face Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="mt-2 w-full cursor-pointer rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          />
          {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}
        </div>
        <div className="flex items-center justify-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-slate-300 dark:ring-slate-600">
            {fileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">No photo</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-slate-600 dark:text-slate-300">Estimated Health Score</div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{loading ? '…' : score != null ? `${score}%` : '--'}</div>
          {score != null && (
            <span className={`text-sm ${score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'Needs Attention'}
            </span>
          )}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-2 rounded-full ${score == null ? 'w-0' : score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: score != null ? `${score}%` : undefined }}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">This is a lightweight visual estimate using image brightness — not a medical tool.</p>
    </div>
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
    // luminance approx
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    total += y;
  }
  const avg = total / (dim * dim);
  // Map brightness (0-255) to 30-95% to avoid extremes
  const pct = Math.round(30 + (avg / 255) * 65);
  return Math.max(0, Math.min(100, pct));
}
