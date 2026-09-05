/* lucide-react v1 dropped brand marks, and porting.md says brand glyphs stay as
   local SVG rather than being faked with a lookalike lucide icon. Minimal
   single-path marks, sized by the `size-*` class like a lucide icon. */

type P = { className?: string };
const base = "shrink-0 fill-current";

export function FacebookIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${base} ${className}`}>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h2.5l.5-3H13v-2c0-.6.4-1 1-1z" />
    </svg>
  );
}

export function XIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${base} ${className}`}>
      <path d="M17.5 4h2.6l-5.7 6.5L21 20h-5.2l-4.1-5.3L6.9 20H4.3l6.1-6.9L3.5 4h5.4l3.7 4.9L17.5 4zm-.9 14.4h1.4L8.5 5.5H7l9.6 12.9z" />
    </svg>
  );
}

export function InstagramIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${base} ${className}`}>
      <path d="M12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8zm0 5.6a2.2 2.2 0 110-4.4 2.2 2.2 0 010 4.4zm4.3-5.8a.8.8 0 11-1.6 0 .8.8 0 011.6 0zM16 4H8a4 4 0 00-4 4v8a4 4 0 004 4h8a4 4 0 004-4V8a4 4 0 00-4-4zm2.8 12a2.8 2.8 0 01-2.8 2.8H8A2.8 2.8 0 015.2 16V8A2.8 2.8 0 018 5.2h8A2.8 2.8 0 0118.8 8v8z" />
    </svg>
  );
}

export function LinkedinIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${base} ${className}`}>
      <path d="M6.9 8.5H4.3V20h2.6V8.5zM5.6 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM20 13.4c0-3-1.6-4.4-3.7-4.4-1.7 0-2.5.9-2.9 1.6V8.5H10.8V20h2.6v-6.2c0-1.3.6-2.1 1.8-2.1 1.1 0 1.7.7 1.7 2.1V20H20v-6.6z" />
    </svg>
  );
}

export const SOCIAL_ICONS = [FacebookIcon, XIcon, InstagramIcon, LinkedinIcon];
