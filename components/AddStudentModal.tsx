'use client' // Forces this component to run in the browser

import { useState } from 'react';
import { createStudent } from '@/lib/actions';

export default function AddStudentModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-slate-200">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm transition-colors"
      >
        {isOpen ? 'Close Form' : '+ Add New Student'}
      </button>

      {isOpen && (
        <form action={createStudent} className="mt-4 space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
            <input name="studentName" type="text" required className="w-full p-2 border rounded text-sm bg-slate-50 focus:outline-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
            <input name="studentEmail" type="email" required className="w-full p-2 border rounded text-sm bg-slate-50 focus:outline-blue-500" />
          </div>
          <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700">
            Save to System
          </button>
        </form>
      )}
    </div>
  );
}
