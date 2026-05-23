import AddStudentModal from '@/components/AddStudentModal';

// This is a Server Component by default (SSR)
export default async function StudentsPage() {
  // Real world: fetch data directly from your database here
  // const students = await db.student.findMany();
  const mockStudents = [
    { id: '1', name: 'Habib Sankary', email: 'habib@university.edu' },
    { id: '2', name: 'Alex Smith', email: 'alex@university.edu' }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Student Management Directory</h1>
        <p className="text-sm text-slate-500">Manage, register, and update student system records.</p>
      </header>

      {/* Interactive CSR Component Nested Inside SSR Page */}
      <AddStudentModal />

      <div className="overflow-hidden bg-white border border-slate-200 rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
            {mockStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono text-xs text-slate-400">{student.id}</td>
                <td className="p-4 font-medium">{student.name}</td>
                <td className="p-4 text-slate-500">{student.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
