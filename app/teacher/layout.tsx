import Sidebar from "@/components/Sidebar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 pl-64 bg-slate-50 min-h-screen">
        <div className="py-6">{children}</div>
      </main>
    </div>
  );
}
