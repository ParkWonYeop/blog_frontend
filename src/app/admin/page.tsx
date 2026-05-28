'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Eye,
  FileText,
  FolderTree,
  Loader2,
  PenLine,
  Settings,
  Sparkles,
} from 'lucide-react';
import { getCategories } from '@/api/category';
import { getPosts } from '@/api/posts';
import AdminCategoryPanel from '@/components/admin/AdminCategoryPanel';
import AdminProfilePanel from '@/components/admin/AdminProfilePanel';
import { useAuthStore } from '@/store/authStore';
import { Category, Post } from '@/types';

const countCategories = (categories: Category[] = []): number => {
  return categories.reduce((count, category) => {
    return count + 1 + countCategories(category.children || []);
  }, 0);
};

const formatDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{post.title}</p>
        <p className="mt-1 text-xs text-gray-500">
          {post.categoryName || '미분류'} · {formatDate(post.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
        <Eye size={14} />
        <span>{post.viewCount.toLocaleString()}</span>
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { isLoggedIn, role, _hasHydrated } = useAuthStore();
  const isAdmin = _hasHydrated && role?.includes('ADMIN');

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      toast.error('관리자 권한이 필요합니다.');
      router.replace('/');
    }
  }, [_hasHydrated, isAdmin, isLoggedIn, router]);

  const { data: latestData, isLoading: isLatestLoading } = useQuery({
    queryKey: ['posts', 'admin', 'latest'],
    queryFn: () => getPosts({ size: 5, sort: 'createdAt,desc' }),
    enabled: isAdmin,
    retry: 0,
  });

  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['posts', 'admin', 'popular'],
    queryFn: () => getPosts({ size: 5, sort: 'viewCount,desc' }),
    enabled: isAdmin,
    retry: 0,
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: isAdmin,
    retry: 0,
  });

  if (!_hasHydrated || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={36} />
      </div>
    );
  }

  const isLoading = isLatestLoading || isPopularLoading || isCategoriesLoading;
  const latestPosts = latestData?.content ?? [];
  const popularPosts = popularData?.content ?? [];
  const totalPosts = latestData?.totalElements ?? 0;
  const totalCategories = countCategories(categories);
  const lastUpdatedAt = latestPosts[0]?.createdAt;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-1 py-4 md:px-4">
      <header className="flex flex-col justify-between gap-5 border-b border-gray-200 pb-8 md:flex-row md:items-end">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Settings size={14} />
            Admin
          </p>
          <h1 className="text-3xl font-bold tracking-normal text-gray-950 md:text-4xl">
            관리자 설정
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            공개 화면과 분리된 운영 공간입니다. 게시글 현황을 확인하고 프로필과 카테고리를 정리할 수 있습니다.
          </p>
        </div>

        <Link
          href="/write"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          <PenLine size={17} />
          새 글 작성
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-sm font-medium">총 게시글</span>
            <FileText size={18} />
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-950">{totalPosts.toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-sm font-medium">카테고리</span>
            <FolderTree size={18} />
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-950">{totalCategories.toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-sm font-medium">최근 업데이트</span>
            <Sparkles size={18} />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-950">{formatDate(lastUpdatedAt)}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">최근 글</h2>
              <p className="mt-1 text-sm text-gray-500">발행 흐름을 빠르게 확인합니다.</p>
            </div>
            <Link
              href="/archive"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              전체보기
              <ArrowRight size={15} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : latestPosts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {latestPosts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
              아직 작성된 글이 없습니다.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-950">인기 글</h2>
          <p className="mt-1 text-sm text-gray-500">조회수가 높은 글을 확인합니다.</p>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : popularPosts.length > 0 ? (
            <div className="mt-4 divide-y divide-gray-100">
              {popularPosts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
              아직 집계된 인기 글이 없습니다.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <AdminProfilePanel />
        <AdminCategoryPanel />
      </section>
    </div>
  );
}
