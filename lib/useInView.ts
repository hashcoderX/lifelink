import { useEffect, useRef, useState } from 'react';

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.2, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView } as const;
}
