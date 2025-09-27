'use client';

import Image from 'next/image';
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
    <main className="min-h-screen text-slate-100">
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        {/* Hero section with enhanced visual effects */}
        <div className="mb-12 text-center">
          <div className="relative mb-8">
            {/* Glowing icon container */}
            <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 blur-xl opacity-30" />
            <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/40 bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-400 shadow-2xl shadow-emerald-500/40">
              <Image
                src="/burger.png"
                alt="Checklist and burger icon"
                width={96}
                height={96}
                className="h-20 w-20 rounded-full object-cover shadow-md shadow-emerald-500/30"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent mb-6 drop-shadow-sm">
            Burn It, Then Earn It
          </h1>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-2xl blur-3xl" />
            <p className="relative text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
              Track your workout intensity and discover the perfect meal to match your burned calories.
            </p>
          </div>
        </div>

        <section className="w-full max-w-2xl relative">
          {/* Enhanced glowing border effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-3xl blur-2xl opacity-20 animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/60 via-emerald-500/60 to-emerald-400/60 rounded-2xl blur-lg opacity-30" />
          
          <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-2xl p-10 shadow-2xl">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/8 via-white/3 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-400/5" />
            
            <form className="relative space-y-8" onSubmit={handleSubmit}>
              <div className="group">
                <label className="block">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-200">
                      Activity
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-slate-600/60 bg-slate-950/60 backdrop-blur-sm p-5 text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:bg-slate-950/80 group-hover:border-slate-500/70 focus:shadow-lg focus:shadow-emerald-500/10"
                      type="text"
                      placeholder="e.g., Running, Cycling, Swimming, Weightlifting"
                      value={activity}
                      onChange={(event) => setActivity(event.target.value)}
                    />
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 transition-opacity duration-300 focus-within:opacity-100" />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-200">
                        Weight
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-600/60 bg-slate-950/60 backdrop-blur-sm p-5 pr-16 text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:bg-slate-950/80 group-hover:border-slate-500/70 focus:shadow-lg focus:shadow-emerald-500/10"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="150"
                        value={weight}
                        onChange={(event) => setWeight(event.target.value)}
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">lbs</span>
                      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 transition-opacity duration-300 focus-within:opacity-100" />
                    </div>
                  </label>
                </div>

                <div className="group">
                  <label className="block">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-200">
                        Duration
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-600/60 bg-slate-950/60 backdrop-blur-sm p-5 pr-16 text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:bg-slate-950/80 group-hover:border-slate-500/70 focus:shadow-lg focus:shadow-emerald-500/10"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="30"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">min</span>
                      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 transition-opacity duration-300 focus-within:opacity-100" />
                    </div>
                  </label>
                </div>
              </div>

              <button
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 py-5 text-lg font-semibold text-white shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 hover:shadow-3xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
                type="submit"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-3">
                  Continue to Workout Selection
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </form>

            {message && (
              <div className="mt-8 relative animate-in slide-in-from-top duration-300">
                <div className="absolute -inset-1 bg-red-500/30 rounded-xl blur-lg" />
                <div className="relative rounded-xl border border-red-500/40 bg-red-500/10 backdrop-blur-sm p-5">
                  <p className="text-sm text-red-300 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
