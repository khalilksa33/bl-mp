// frontend/src/app/[locale]/layout.tsx
import React from 'react';
import { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '../global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

// Mock/Simple function to determine layout direction based on locale
// In a full implementation, this maps key locales to RTL scripts (e.g., ar, he, fa)
export function getDirection(locale: string): 'rtl' | 'ltr' {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale.toLowerCase()) ? 'rtl' : 'ltr';
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const dir = getDirection(resolvedParams.locale);
  return {
    title: {
      template: '%s | Global Multi-Tenant Marketplace',
      default: 'Premium Enterprise Multi-Tenant Marketplace',
    },
    description: 'High-frequency, localized, multi-tenant marketplace platform for regional commerce.',
    other: {
      dir: dir,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const dir = getDirection(resolvedParams.locale);

  return (
    <html lang={resolvedParams.locale} dir={dir} className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <head>
        {/* Dynamic SEO Tagging */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-300">
        <main className="flex min-h-screen flex-col items-stretch justify-start">
          {children}
        </main>
      </body>
    </html>
  );
}
