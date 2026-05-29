import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';
import DesktopShell from '@/components/layout/DesktopShell';
import { THEME_INIT_SCRIPT } from '@/components/theme/theme';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'ko_KR',
  },
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
          <DesktopShell>{children}</DesktopShell>
        </Providers>
      </body>
    </html>
  );
}

