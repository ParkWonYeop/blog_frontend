'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Loader2, Save, UserRound } from 'lucide-react';
import { getProfile, updateProfile } from '@/api/profile';
import { uploadImage } from '@/api/image';
import WindowSurface from '@/components/ui/WindowSurface';
import { Profile, ProfileUpdateRequest } from '@/types';

const defaultProfile: Profile = {
  name: 'Dev Park',
  bio: '풀스택을 꿈꾸는 개발자\n"코드로 세상을 바꾸고 싶은 박개발의 기술 블로그입니다."',
  imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
  githubUrl: 'https://github.com',
  email: 'user@example.com',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return `${fallback}: ${response.data.message}`;
  }

  if (error instanceof Error) return `${fallback}: ${error.message}`;

  return fallback;
};

function toProfileForm(profile: Profile): ProfileUpdateRequest {
  return {
    name: profile.name,
    bio: profile.bio,
    imageUrl: profile.imageUrl || '',
    githubUrl: profile.githubUrl || '',
    email: profile.email || '',
  };
}

function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileUpdateRequest>(() => toProfileForm(profile));
  const [isUploading, setIsUploading] = useState(false);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('프로필이 저장되었습니다.');
    },
    onError: (error) => toast.error(getErrorMessage(error, '프로필 저장 실패')),
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadToast = toast.loading('이미지 업로드 중...');

    try {
      const response = await uploadImage(file);
      if (response.code === 'SUCCESS' && response.data) {
        setForm((previous) => ({ ...previous, imageUrl: response.data }));
        toast.success('이미지가 업로드되었습니다.', { id: uploadToast });
      } else {
        toast.error(response.message || '이미지 업로드 실패', { id: uploadToast });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, '이미지 업로드 실패'), { id: uploadToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateMutation.mutate({
      ...form,
      name: form.name.trim(),
      bio: form.bio.trim(),
      githubUrl: form.githubUrl?.trim(),
      email: form.email?.trim(),
      imageUrl: form.imageUrl?.trim(),
    });
  };

  const isSaving = updateMutation.isPending || isUploading;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-28 w-28 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm"
          aria-label="프로필 이미지 변경"
        >
          <Image
            src={form.imageUrl || defaultProfile.imageUrl!}
            alt="프로필 미리보기"
            fill
            sizes="112px"
            className="object-cover"
            unoptimized
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition-opacity group-hover:opacity-100">
            {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={isSaving}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSaving}
          className="mt-4 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          이미지 변경
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-gray-500">이름</span>
            <input
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-gray-500">Email</span>
            <input
              type="email"
              value={form.email || ''}
              onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-bold text-gray-500">Github URL</span>
          <input
            type="url"
            value={form.githubUrl || ''}
            onChange={(event) => setForm((previous) => ({ ...previous, githubUrl: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-gray-500">소개</span>
          <textarea
            value={form.bio}
            onChange={(event) => setForm((previous) => ({ ...previous, bio: event.target.value }))}
            className="mt-1 h-28 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            저장하기
          </button>
        </div>
      </div>
    </form>
  );
}

export default function AdminProfilePanel() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: 0,
  });

  const displayProfile = profile ? { ...defaultProfile, ...profile } : defaultProfile;
  const formKey = [
    displayProfile.name,
    displayProfile.bio,
    displayProfile.imageUrl,
    displayProfile.githubUrl,
    displayProfile.email,
  ].join('|');

  return (
    <WindowSurface title="Profile" subtitle="Public identity" bodyClassName="p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
            <UserRound size={19} />
            프로필 관리
          </h2>
          <p className="mt-1 text-sm text-gray-500">공개 사이드바에 표시되는 블로그 소개를 수정합니다.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center rounded-lg bg-gray-50">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : (
        <ProfileForm key={formKey} profile={displayProfile} />
      )}
    </WindowSurface>
  );
}
