import AdminRouteShell from '@/features/admin/components/AdminRouteShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteShell>{children}</AdminRouteShell>;
}
