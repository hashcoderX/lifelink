"use client";
import Logo from './Logo';
import { useCallback } from 'react';

export default function Footer() {
  const scrollToSection = useCallback((id: string) => {
    const headerOffset = 64;
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const rectTop = el.getBoundingClientRect().top + window.pageYOffset;
    const top = Math.max(0, rectTop - headerOffset - 8);
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);
  return (
    <footer id="contact" className="border-t border-slate-200/60 bg-white py-12 dark:border-slate-700 dark:bg-slate-950">
      <div className="container-max grid grid-cols-1 items-center gap-6 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <nav className="flex justify-center gap-6 text-sm">
          <a href="#" onClick={(e)=>{e.preventDefault();scrollToSection('home');}} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">Home</a>
          <a href="#" onClick={(e)=>{e.preventDefault();scrollToSection('about');}} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">About</a>
          <a href="#" onClick={(e)=>{e.preventDefault();scrollToSection('research');}} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">Research</a>
          <a href="#" onClick={(e)=>{e.preventDefault();scrollToSection('donate');}} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">Donate</a>
          <a href="#" onClick={(e)=>{e.preventDefault();scrollToSection('contact');}} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">Contact</a>
        </nav>
        <div className="flex justify-center gap-4 md:justify-end">
          <a href="#" aria-label="LinkedIn" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0H12v2.2h.07c.63-1.2 2.17-2.46 4.47-2.46 4.78 0 5.66 3.15 5.66 7.24V24h-5v-7.56c0-1.8-.03-4.1-2.5-4.1-2.5 0-2.88 1.95-2.88 3.97V24h-5V8z" fill="currentColor"/>
            </svg>
          </a>
          <a href="#" aria-label="X (Twitter)" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M18.244 2H21L13.56 11.51 22 22h-6.59l-5.14-6.26L4.4 22H2l8.03-10.19L2 2h6.68l4.66 5.69L18.244 2z" fill="currentColor"/>
            </svg>
          </a>
          <a href="#" aria-label="Facebook" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.5-4 3.9-4 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" fill="currentColor"/>
            </svg>
          </a>
        </div>
      </div>
      <div className="container-max mt-8 text-center text-sm text-slate-500 dark:text-slate-400">© 2025 LifeLink (Pvt) Ltd — All Rights Reserved.</div>
    </footer>
  );
}
