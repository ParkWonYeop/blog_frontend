// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader'; // 👈 import 추가

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
        <Providers>
          <div className="min-h-screen flex">
            {/* 사이드바 */}
            <Sidebar />

            {/* 메인 영역 */}
            <main className="flex-1 transition-all duration-300 md:ml-72 w-full relative"> {/* 👈 relative 확인 */}
              
              {/* 👇 여기에 TopHeader 추가! */}
              <TopHeader />

              <div className="max-w-4xl mx-auto p-6 md:p-12 pt-20"> {/* 👈 상단 여백(pt-20) 살짝 추가 */}
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}