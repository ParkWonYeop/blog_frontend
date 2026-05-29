import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';
import DesktopDock from '@/components/layout/DesktopDock';
import DesktopMenuBar from '@/components/layout/DesktopMenuBar';
import Sidebar from '@/components/layout/Sidebar';
import { THEME_INIT_SCRIPT } from '@/components/theme/theme';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WYPark Blog',
  description: '개발 블로그',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-theme="light" data-theme-mode="system" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="cFJSK1ayy2Y4lqRKNv8wZ_vybg5De22zYCdbKSfvAJA" />
      </head>
      <body className={`${pretendard.variable} ${pretendard.className} text-[var(--color-text)] antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2GLCM9ZKMK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2GLCM9ZKMK');
          `}
        </Script>

        <Providers>
          <div className="min-h-screen">
            <Sidebar />
            <DesktopMenuBar />
            <DesktopDock />

            <main className="relative w-full flex-1 transition-all duration-300 md:ml-72">
              <div className="mx-auto w-full px-4 pb-28 pt-20 md:px-8 md:pb-32 md:pt-24">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
