import type { Metadata } from 'next';
import './globals.css';
import { cinematicBoot } from '../lib/cinematic';
import { themeBoot } from '../lib/theme';
import { brandIcons } from '../lib/brand';
import BrandLoading from '../components/BrandLoading';

export const metadata: Metadata = {
  metadataBase: new URL('https://samjoseph.me'),
  title: 'Sam Joseph — Developer & Builder',
  description:
    'The portfolio of Sam Joseph. Practical full-stack projects, browser games, and a curiosity for how software systems work.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Sam Joseph — Developer & Builder',
    description: 'Code, curiosity, and practical systems. Explore my projects and browser games.',
    url: 'https://samjoseph.me',
    type: 'website',
    locale: 'en_US',
  },
  twitter: { card: 'summary', title: 'Sam Joseph — Developer & Builder' },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Bootstrap owns live icons to avoid React hoisting a second pair on
            saved-light hydration. No-JS visitors keep the dark default. */}
        <noscript dangerouslySetInnerHTML={{ __html: `<link rel="icon" type="image/svg+xml" href="${brandIcons.dark.svg}"><link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48" href="${brandIcons.dark.ico}">` }} />
        <script id="theme-boot" dangerouslySetInnerHTML={{ __html: themeBoot }} />
        {/* Prepare before first paint; fail open if hydration is unavailable/slow. */}
        <script id="cinema-boot" dangerouslySetInnerHTML={{ __html: cinematicBoot }} />
      </head>
      <body><BrandLoading initial />{children}</body>
    </html>
  );
}
