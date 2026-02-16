export default function Logo({ withText = true, className = '' }: { withText?: boolean; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef009d" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>
        <path d="M24 42s-14-8.4-18.4-17.5C1.7 16.1 7.2 6 16.1 6c4.8 0 7.4 3 7.9 3.6.5-.6 3.1-3.6 7.9-3.6 8.9 0 14.4 10.1 10.5 18.5C38 33.6 24 42 24 42z" fill="url(#grad)"/>
        <path d="M23.9 17.5c-2.1-2.7-6.9-2.3-8.9.5-1.8 2.6-1.1 6.3 1.2 8.3 2.9 2.5 7.7 4.8 7.7 4.8s4.8-2.3 7.7-4.8c2.3-2 3-5.7 1.2-8.3-2-2.8-6.8-3.2-8.9-.5-.4.6-1.3.6-1.7 0z" fill="#fff" fillOpacity="0.85"/>
      </svg>
  {withText && <span className="text-lg font-semibold tracking-tight">LifeLinks AI</span>}
    </div>
  );
}
