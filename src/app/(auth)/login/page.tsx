'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="glass w-full max-w-md space-y-8 rounded-3xl p-10">
        <div className="text-center">
          <h2 className="outfit text-3xl font-bold tracking-tight text-white">Flownaŭ</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to your media factory</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="ml-1 text-sm font-medium text-gray-300">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:ring-2 focus:ring-white/20 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="ml-1 text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:ring-2 focus:ring-white/20 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative flex w-full transform justify-center rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:scale-[1.02] hover:bg-gray-200 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
