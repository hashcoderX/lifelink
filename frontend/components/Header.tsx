"use client";
import Logo from './Logo';
import { useEffect, useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

const nav = [
  { name: 'Home', id: 'home', type: 'anchor' },
  { name: 'Analyze', href: '/analyze', type: 'route' },
  { name: 'Articles', href: '/articles', type: 'route' },
  { name: 'Donate', id: 'donate', type: 'anchor' },
];

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  // Call useSession unconditionally (hook rules) and access data defensively
  const sessionHook = useSession();
  const session = sessionHook?.data;
  const router = useRouter();
  const pathname = usePathname();

  const scrollToSection = useCallback((id: string) => {
    const headerOffset = 64; // header height
    if (pathname === '/') {
      // Already on home page, just scroll
      if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      const rectTop = el.getBoundingClientRect().top + window.pageYOffset;
      const top = Math.max(0, rectTop - headerOffset - 8);
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      // Navigate to home page with hash
      router.push(`/#${id}`);
    }
  }, [pathname, router]);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      root.classList.add('dark');
      setDark(true);
    }

    // Handle hash scrolling on page load
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => scrollToSection(hash), 100); // Small delay to ensure DOM is ready
    }
  }, [scrollToSection]);

  const toggle = () => {
    const root = document.documentElement;
    const next = !dark;
    setDark(next);
    if (next) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
  <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-950/80">
      <div className="container-max flex h-16 items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('home');
          }}
          className="flex items-center gap-2"
          aria-label="LifeLink Home"
        >
          <Logo />
        </a>

        <nav className="hidden gap-6 text-sm md:flex">
          {nav.map((item) => {
            if (item.type === 'anchor') {
              return (
                <a
                  key={item.name}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id!);
                  }}
                  className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {item.name}
                </a>
              );
            }
            return (
              <a
                key={item.name}
                href={item.href}
                className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              >
                {item.name}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mounted && dark ? 'Light' : 'Dark'}
          </button>
          {session ? (
            <>
              <a
                href="/profile"
                className="hidden text-xs text-slate-600 underline-offset-4 hover:underline dark:text-slate-300 lg:inline"
                title="View profile"
              >
                Hi {session.user?.name || 'User'}{(session.user as any)?.role ? ` · ${(session.user as any).role}` : ''}
              </a>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => signIn()}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign in
              </button>
              <a
                href={"/signup"}
                className="btn"
              >
                Join Our Mission
              </a>
            </>
          )}
        </div>

        {/* Mobile menu (simple) */}
        <div className="flex gap-2 md:hidden">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mounted && dark ? '☀️' : '🌙'}
          </button>
          {session ? (
            <div className="flex items-center gap-2">
              <a href="/profile" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Profile</a>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn px-4 py-2 text-xs"
              >
                Sign out
              </button>
            </div>
          ) : (
            <a href="/signup" className="btn px-4 py-2 text-xs">Join</a>
          )}
        </div>
      </div>
    </header>
  );
}
