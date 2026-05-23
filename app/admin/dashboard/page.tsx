import AttendanceTable from '@/components/AttendanceTable';

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Admin Metrics & Analytics</h1>
      <AttendanceTable />
    </div>
  );
}
