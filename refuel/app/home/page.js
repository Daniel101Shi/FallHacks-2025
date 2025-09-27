'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'refuel:lastActivitySearch';

export default function HomePage() {
  const [activity, setActivity] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActivity(parsed.activity ?? '');
        if (parsed?.weight != null) setWeight(String(parsed.weight));
        if (parsed?.duration != null) setDuration(String(parsed.duration));
      }
    } catch (error) {
      console.error('Failed to read stored search data', error);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');

    const trimmedActivity = activity.trim();
    if (!trimmedActivity) {
      setMessage('Please enter an activity.');
      return;
    }

    const numericWeight = Number(weight);
    if (!weight || !Number.isFinite(numericWeight) || numericWeight <= 0) {
      setMessage('Please enter a valid weight in pounds.');
      return;
    }

    const numericDuration = Number(duration);
    if (!duration || !Number.isFinite(numericDuration) || numericDuration <= 0) {
      setMessage('Please enter how long the activity lasted (minutes).');
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const payload = {
      activity: trimmedActivity,
      weight: Number(numericWeight.toFixed(2)),
      duration: Math.round(numericDuration),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      router.push('/secondSearch');
    } catch (error) {
      console.error('Failed to store search data', error);
      setMessage('Unable to save right now—try again later.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,theme(colors.emerald.500/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.emerald.400/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_50%_50%,transparent_0deg,theme(colors.emerald.500/0.05)_90deg,transparent_180deg)]" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 text-slate-100">
        {/* Hero section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 mb-6 shadow-lg shadow-emerald-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent mb-3">
            Burn It, Then Earn It
          </h1>
          <p className="text-lg text-slate-300 max-w-md mx-auto leading-relaxed">
            Track your workout intensity and discover the perfect meal to match your burned calories.
          </p>
        </div>

        <section className="w-full max-w-xl relative">
          {/* Glowing border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-2xl blur-lg opacity-25" />
          
          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent" />
            
            <form className="relative space-y-6" onSubmit={handleSubmit}>
              <div className="group">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-200 mb-2 block">
                    Activity
                  </span>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-slate-600/50 bg-slate-950/50 backdrop-blur-sm p-4 text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-slate-950/80 group-hover:border-slate-500/70"
                      type="text"
                      placeholder="e.g., Running, Cycling, Swimming"
                      value={activity}
                      onChange={(event) => setActivity(event.target.value)}
                    />
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 transition-opacity focus-within:opacity-100" />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-200 mb-2 block">
                      Weight
                    </span>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-950/50 backdrop-blur-sm p-4 text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-slate-950/80 group-hover:border-slate-500/70"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="150"
                        value={weight}
                        onChange={(event) => setWeight(event.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">lbs</span>
                      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 transition-opacity focus-within:opacity-100" />
                    </div>
                  </label>
                </div>

                <div className="group">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-200 mb-2 block">
                      Duration
                    </span>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-950/50 backdrop-blur-sm p-4 text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-slate-950/80 group-hover:border-slate-500/70"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="30"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">min</span>
                      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 transition-opacity focus-within:opacity-100" />
                    </div>
                  </label>
                </div>
              </div>

              <button
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
                type="submit"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex items-center justify-center gap-2">
                  Continue to Workout Selection
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </form>

            {message && (
              <div className="mt-6 relative">
                <div className="absolute -inset-1 bg-red-500/20 rounded-xl blur" />
                <div className="relative rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-red-300 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}