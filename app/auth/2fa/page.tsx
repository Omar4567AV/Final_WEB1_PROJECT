'use client'

import { useActionState, startTransition } from 'react';
import { verifyOTPAction } from '@/app/actions/auth';

export default function TwoFactorPage() {
  const [state, action, isPending] = useActionState(verifyOTPAction, undefined);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => { action(formData); });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-6 py-12 lg:px-8">
      <div className="sm:mx-auto w-full sm:max-w-md bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">ClaudeForce 2FA Checking</h2>
          <p className="mt-2 text-sm text-slate-500">Enter the 6-digit dynamic code from your authenticator application below.</p>
        </div>

        {state?.error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-md border border-red-100">
            {state.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Verification Code</label>
            <input
              type="text"
              name="otp"
              maxLength={6}
              required
              placeholder="000000"
              className="block w-full tracking-[0.5em] text-center font-mono text-lg rounded-md border border-slate-200 bg-slate-50 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Verifying Code...' : 'Confirm Secure Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}
