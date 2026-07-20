import { getTeacherList } from '@/lib/teacher-profile';
import { TeacherDirectory } from '@/components/TeacherDirectory';

export default async function TeachersPage() {
  const teachers = await getTeacherList();

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#171813]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-32 pb-16">
        <TeacherDirectory teachers={teachers} />
      </div>
    </div>
  );
}
