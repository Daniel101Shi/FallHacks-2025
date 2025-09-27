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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-xl rounded-lg border border-slate-800 bg-slate-900 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">Burn It, Then Earn It</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track your workout to match the perfect meal for your burned calories.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">Activity</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              type="text"
              placeholder="e.g., Running, Cycling"
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Weight (lbs)</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              type="number"
              min="1"
              step="any"
              placeholder="Enter your weight"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Duration (minutes)</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              type="number"
              min="1"
              step="1"
              placeholder="How long did you work out?"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>

          <button
            className="w-full rounded-md bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            type="submit"
          >
            Save activity
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-red-400" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
