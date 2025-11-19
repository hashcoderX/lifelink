import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'LifeLink — Connecting Lives Through AI',
  description:
    'LifeLink leverages ethical, data-driven artificial intelligence to match kidney donors and patients with precision and compassion.',
  keywords: [
    'LifeLink',
    'kidney donation',
    'AI healthcare',
    'organ donor matching',
    'ethical data'
  ],
  authors: [{ name: 'LifeLink (Pvt) Ltd' }],
  creator: 'LifeLink (Pvt) Ltd',
  publisher: 'LifeLink (Pvt) Ltd',
  metadataBase: new URL('https://www.lifelink.example'),
  openGraph: {
    title: 'LifeLink — Connecting Lives Through AI',
    description:
      'LifeLink bridges the gap between kidney donors and patients using secure, AI-powered algorithms.',
    url: 'https://www.lifelink.example',
    siteName: 'LifeLink',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifeLink — Connecting Lives Through AI',
    description:
      'AI-driven platform matching kidney donors and patients with precision and compassion.'
  },
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>
    <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
