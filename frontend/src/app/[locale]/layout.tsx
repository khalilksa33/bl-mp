// frontend/src/app/[locale]/layout.tsx
import React from 'react';
import { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '../global.css';

export async function generateStaticParams() {
  return [{ locale: 'en' }];
}

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
function getDirection(locale: string): 'rtl' | 'ltr' {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale.toLowerCase()) ? 'rtl' : 'ltr';
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const dir = getDirection(resolvedParams.locale);
  const isAr = resolvedParams.locale === 'ar';
  return {
    title: {
      template: isAr ? '%s | نكسس السعودية' : '%s | Nexus KSA Auto Marketplace',
      default: isAr 
        ? 'منصة نكسس السعودية - سوق قطع غيار السيارات والخدمات المتكاملة' 
        : 'Nexus KSA - Saudi Arabia\'s #1 Automotive Services & Parts Hub',
    },
    description: isAr 
      ? 'نكسس هي المنصة السعودية الأولى لخدمات السيارات وقطع الغيار. ابحث عن تشليح، قطع غيار جديدة، سطحات، ورش متنقلة، ميزان إلكتروني، وخدمات صيانة في الرياض، جدة، الدمام وكافة أنحاء المملكة.'
      : 'Nexus is Saudi Arabia\'s premier automotive multi-tenant platform. Find Tashleeh used parts, new auto parts, flatbed towing (Satha), mobile workshops, digital alignment, and mechanics across Riyadh, Jeddah, Dammam, and all of Saudi Arabia.',
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
