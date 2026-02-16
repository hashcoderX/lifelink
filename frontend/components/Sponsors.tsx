"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Sponsor {
  id: number;
  name: string;
  logo?: string;
  website?: string;
}

const defaultSponsors = [
  { id: 1, name: 'Medical Center', logo: '/images/sponsor1.png' },
  { id: 2, name: 'Health Foundation', logo: '/images/sponsor2.png' },
  { id: 3, name: 'Life Sciences', logo: '/images/sponsor3.png' },
  { id: 4, name: 'Research Institute', logo: '/images/sponsor4.png' },
  { id: 5, name: 'Wellness Corp', logo: '/images/sponsor5.png' },
  { id: 6, name: 'Care Network', logo: '/images/sponsor6.png' },
];

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(defaultSponsors);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/public/sponsors');
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSponsors(data);
        }
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      // Keep default sponsors on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
      <div className="container-max">
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Our Trusted Partners</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Organizations supporting our mission to save lives</p>
        </div>

        {/* Moving Carousel */}
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll">
            {/* First set of sponsors */}
            {sponsors.map((sponsor) => (
              <div
                key={`first-${sponsor.id}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center min-w-[200px] h-16"
              >
                <div className="relative w-full h-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                  {sponsor.logo ? (
                    <Image
                      src={`/storage/${sponsor.logo}`}
                      alt={sponsor.name}
                      width={150}
                      height={50}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`text-slate-400 dark:text-slate-500 text-sm font-medium text-center ${sponsor.logo ? 'hidden' : ''}`}>
                    {sponsor.name}
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {sponsors.map((sponsor) => (
              <div
                key={`second-${sponsor.id}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center min-w-[200px] h-16"
              >
                <div className="relative w-full h-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                  {sponsor.logo ? (
                    <Image
                      src={`/storage/${sponsor.logo}`}
                      alt={sponsor.name}
                      width={150}
                      height={50}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`text-slate-400 dark:text-slate-500 text-sm font-medium text-center ${sponsor.logo ? 'hidden' : ''}`}>
                    {sponsor.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}