"use client";
import React from 'react';
import { useSession } from 'next-auth/react';
import { analyzeReport, AnalyzeReportResult } from '@/lib/backend';

type LabValue = {
  name: string;
  value: number;
  unit: string;
  flag: string;
  range?: string;
};

function parseLabValues(text: string): LabValue[] {
  const labs: LabValue[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    // Match patterns like "HbA1c 8.6 % H" or "Creatinine: 1.2 mg/dL"
    const match = line.match(/([A-Za-z\s]+)[:\s]*(\d+(?:\.\d+)?)\s*([A-Za-z%\/]+)\s*([A-Z]?)/);
    if (match) {
      const [, name, valueStr, unit, flag] = match;
      const value = parseFloat(valueStr);
      if (!isNaN(value)) {
        labs.push({
          name: name.trim(),
          value,
          unit: unit.trim(),
          flag: flag || '',
          range: getReferenceRange(name.trim(), unit.trim()),
        });
      }
    }
  }
  return labs;
}

function getReferenceRange(name: string, unit: string): string {
  const ranges: Record<string, string> = {
    'HbA1c': 'Below 5.6: Normal, 5.6-7: Good, 7-8: Fair, 8-10: Poor, >10: Very Poor',
    'Creatinine': '0.7-1.2 mg/dL (varies by age/sex)',
    'Urea': '7-20 mg/dL',
    'Glucose': '70-100 mg/dL (fasting)',
    'Hemoglobin': '12-16 g/dL (female), 14-18 g/dL (male)',
    'Platelet': '150,000-450,000 /µL',
  };
  return ranges[name] || 'Consult doctor for reference';
}

function LabCard({ lab }: { lab: LabValue }) {
  const getColor = (flag: string) => {
    if (flag === 'H') return 'text-rose-600';
    if (flag === 'L') return 'text-blue-600';
    return 'text-slate-600';
  };

  const getBgColor = (flag: string) => {
    if (flag === 'H') return 'bg-rose-50 dark:bg-rose-950/20';
    if (flag === 'L') return 'bg-blue-50 dark:bg-blue-950/20';
    return 'bg-slate-50 dark:bg-slate-800';
  };

  return (
    <div className={`rounded-lg p-4 ${getBgColor(lab.flag)}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-900 dark:text-slate-100">{lab.name}</span>
        <span className={`font-semibold ${getColor(lab.flag)}`}>
          {lab.value} {lab.unit} {lab.flag && `(${lab.flag})`}
        </span>
      </div>
      {lab.range && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{lab.range}</p>
      )}
      {/* Simple graphical: progress bar for HbA1c */}
      {lab.name.toLowerCase().includes('hba1c') && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>0</span>
            <span>5.6</span>
            <span>7</span>
            <span>8</span>
            <span>10</span>
            <span>15</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
              style={{ width: `${Math.min((lab.value / 15) * 100, 100)}%` }}
            ></div>
            <div
              className="relative -top-2 h-4 w-1 bg-slate-900 dark:bg-slate-100"
              style={{ left: `${Math.min((lab.value / 15) * 100, 100)}%`, transform: 'translateX(-50%)' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const [dragOver, setDragOver] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<AnalyzeReportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showRaw, setShowRaw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setFile(f);
    setResult(null);
    setError(null);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeReport(token || '', file);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const labs = result?.ocr_text ? parseLabValues(result.ocr_text) : [];

  return (
    <main className="container-max py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">AI Blood Report Analyzer</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Upload a recent lab/blood test report (PDF, JPG, PNG). We extract text and summarize possible findings. This is not medical advice.</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-900`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <div className="text-lg font-medium text-slate-800 dark:text-slate-200">{file ? file.name : 'Drag & drop or click to select a report'}</div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Supported: PDF, JPG, PNG</div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            disabled={!file || loading}
            onClick={submit}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Analyzing…' : 'Analyze Report'}
          </button>
          {file && !loading && (
            <button
              onClick={() => { setFile(null); setResult(null); setError(null); }}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Reset
            </button>
          )}
        </div>

        {error && <div className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

        {result && (
          <div className="mt-10 space-y-8">
            {/* Conclusion */}
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Conclusion</h2>
              <p className="mt-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{result.ai_analysis}</p>
            </div>

            {/* Graphical Preview */}
            {labs.length > 0 && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Graphical Preview</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Extracted lab values with visual indicators.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {labs.map((lab, i) => (
                    <LabCard key={i} lab={lab} />
                  ))}
                </div>
              </div>
            )}

            {/* Raw Text */}
            {result.ocr_text && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Raw Extracted Text</h2>
                  <button
                    type="button"
                    onClick={() => setShowRaw(!showRaw)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {showRaw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showRaw && (
                  <pre className="mt-4 max-h-64 overflow-auto rounded-md bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {result.ocr_text}
                  </pre>
                )}
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Report ID: {result.report_id} • Experimental. Always consult a qualified physician for diagnosis.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
