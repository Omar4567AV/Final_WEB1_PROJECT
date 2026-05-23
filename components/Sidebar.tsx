import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-100 flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-bold tracking-tight text-white">EduManage System</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin Portal</p>
        <Link href="/admin/dashboard" className="block px-3 py-2 rounded text-sm font-medium hover:bg-slate-800 transition-colors">
          Dashboard
        </Link>
        <Link href="/admin/students" className="block px-3 py-2 rounded text-sm font-medium hover:bg-slate-800 transition-colors">
          Students Directory
        </Link>
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Teacher Portal</p>
          <Link href="/teacher/classes" className="block px-3 py-2 rounded text-sm font-medium hover:bg-slate-800 transition-colors">
            My Classes
          </Link>
        </div>
      </nav>
    </aside>
  );
}
