import AttendanceTable from '@/components/AttendanceTable';

export default function AdminDashboard() {
  const stats = [
    { name: 'Total Enrolled Students', value: '1,482', change: '+4.75%', changeType: 'positive' },
    { name: 'Active Faculty Members', value: '84', change: '0%', changeType: 'neutral' },
    { name: 'Average Attendance Rate', value: '94.2%', change: '+1.2%', changeType: 'positive' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Administrative Metrics</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time overview of institutional operations.</p>
      </header>

      {/* Grid Stats Container */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-xl bg-white px-6 py-5 border border-slate-200 shadow-sm">
            <dt className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{item.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="text-2xl font-bold text-slate-900">{item.value}</div>
              <div className={inline-flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-medium md:mt-2 lg:mt-0 }>
                {item.change}
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <AttendanceTable />
      </div>
    </div>
  );
}
