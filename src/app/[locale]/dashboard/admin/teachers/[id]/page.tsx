import { AdminTeacherForm } from '@/components/admin/AdminTeacherForm';

export default async function EditAdminTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTeacherForm teacherId={id} />;
}
