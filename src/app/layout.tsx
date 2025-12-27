import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import Script from 'next/script'; // 👈 Script 컴포넌트 임포트

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
      <body className="bg-[#f8f9fa] text-gray-800">
        {/* 🌟 Google Analytics 스크립트 추가 */}
        {/* strategy="afterInteractive"는 페이지가 로드된 직후 스크립트를 실행하여 성능을 최적화합니다. */}
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

              <div className="max-w-4xl mx-auto p-6 md:p-12 pt-20">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}