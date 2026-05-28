import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import Script from 'next/script';

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
    <html lang="ko">
      <head>
        <meta name="google-site-verification" content="cFJSK1ayy2Y4lqRKNv8wZ_vybg5De22zYCdbKSfvAJA" />
      </head>
      <body className="bg-[var(--color-page)] text-[var(--color-text)]">
        {/* 🌟 Google Analytics 스크립트 */}
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
          <div className="min-h-screen flex">
            {/* 사이드바 */}
            <Sidebar />

            {/* 메인 영역 */}
            <main className="flex-1 transition-all duration-300 md:ml-72 w-full relative">
              <TopHeader />

              {/* 🛠️ 수정됨: max-w-4xl 제한을 제거하고 w-full로 변경 */}
              {/* 이제 각 페이지(page.tsx)에서 원하는 너비를 설정할 수 있습니다. */}
              <div className="w-full mx-auto p-4 md:p-8 pt-20">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
