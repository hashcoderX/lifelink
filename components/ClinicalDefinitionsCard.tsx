"use client";
import React from 'react';

type Item = {
  term: string;
  description: string;
};

const ITEMS: Item[] = [
  { term: 'BMI (Body Mass Index)', description: 'Measures body fat based on height and weight.' },
  { term: 'HLA Typing', description: 'Identifies genetic markers to check immune compatibility between donor and patient.' },
  { term: 'Crossmatch Result', description: 'Test showing if the patient’s antibodies react against the donor’s cells.' },
  { term: 'Rh Factor', description: 'Protein in blood (+ or –) that affects blood compatibility.' },
  { term: 'PRA Score (Panel Reactive Antibody)', description: 'Percentage showing how likely a patient is to reject a donor kidney.' },
  { term: 'Current Creatinine', description: 'Blood test that shows how well the kidneys are working.' },
  { term: 'GFR (Glomerular Filtration Rate)', description: 'Estimates how efficiently the kidneys filter blood.' },
  { term: 'Urea', description: 'Waste product measured to assess kidney function.' },
  { term: 'DSA (Donor-Specific Antibody)', description: 'Antibodies in the patient’s blood that target a specific donor’s tissue.' },
  { term: 'HIV Status', description: 'Indicates if the person is positive or negative for HIV infection.' },
  { term: 'HBV Status', description: 'Indicates if the person has Hepatitis B infection.' },
  { term: 'HCV Status', description: 'Indicates if the person has Hepatitis C infection.' },
  { term: 'Diabetes', description: 'A condition where blood sugar levels are too high.' },
  { term: 'Hypertension', description: 'High blood pressure that can damage the kidneys.' },
  { term: 'Rejection History', description: 'Record of whether the patient’s body has previously rejected a transplanted organ.' },
  { term: 'Previous Transplant', description: 'Notes if the patient has already received a transplant before.' },
];

export default function ClinicalDefinitionsCard() {
  return (
    <div className="card">
      <div className="mb-2">
        <h3 className="text-sm font-semibold">Clinical Terms — Quick Definitions</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Helpful reference for key transplant and nephrology terms.</p>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-neutral-800">
        {ITEMS.map((item) => (
          <li key={item.term} className="py-2">
            <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{item.term}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
