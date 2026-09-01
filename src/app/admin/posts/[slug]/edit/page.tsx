import AdminPostEditor from '@/features/admin/components/AdminPostEditor';

interface EditAdminPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditAdminPostPage({ params }: EditAdminPostPageProps) {
  const { slug } = await params;

  return <AdminPostEditor editSlug={slug} />;
}
