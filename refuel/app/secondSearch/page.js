'use client';

import { Autocomplete, AutocompleteItem } from '@heroui/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ACTIVITY_KEY = 'refuel:lastActivitySearch';
const WORKOUT_KEY = 'refuel:selectedWorkout';

export default function SecondSearchPage() {
  const [activity, setActivity] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [shouldAutoSearch, setShouldAutoSearch] = useState(false);
  const [mealResults, setMealResults] = useState([]);
  const [mealStatus, setMealStatus] = useState('');
  const [mealError, setMealError] = useState('');
  const [mealLoading, setMealLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [initialVariant, setInitialVariant] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedActivityRaw = window.localStorage.getItem(ACTIVITY_KEY);
      const storedWorkoutRaw = window.localStorage.getItem(WORKOUT_KEY);

      let activityValue = '';
      let weightValue;
      let durationValue;

      if (storedActivityRaw) {
        const parsed = JSON.parse(storedActivityRaw);
        if (typeof parsed?.activity === 'string' && parsed.activity.trim()) {
          activityValue = parsed.activity;
        }
        if (parsed?.weight != null) {
          const numeric = Number(parsed.weight);
          if (Number.isFinite(numeric) && numeric > 0) {
            weightValue = numeric;
          }
        }
        if (parsed?.duration != null) {
          const numeric = Number(parsed.duration);
          if (Number.isFinite(numeric) && numeric > 0) {
            durationValue = numeric;
          }
        }
      }

      if (storedWorkoutRaw) {
        const parsed = JSON.parse(storedWorkoutRaw);
        if (weightValue == null && parsed?.weight != null) {
          const numeric = Number(parsed.weight);
          if (Number.isFinite(numeric) && numeric > 0) {
            weightValue = numeric;
          }
        }
        if (durationValue == null && parsed?.duration != null) {
          const numeric = Number(parsed.duration);
          if (Number.isFinite(numeric) && numeric > 0) {
            durationValue = numeric;
          }
        }
        if (parsed?.variant) setInitialVariant(parsed.variant);
      }

      if (activityValue) {
        setActivity(activityValue);
      } else {
        setStatus('No saved activity found. Go back to change your search.');
      }

      if (weightValue != null) {
        setWeight(String(weightValue));
      }
      if (durationValue != null) {
        setDuration(String(durationValue));
      }

      if (activityValue && weightValue != null && durationValue != null) {
        setShouldAutoSearch(true);
      } else if (activityValue) {
        setStatus('Weight and duration are missing. Go back to update them.');
      }
    } catch (err) {
      console.error('Failed to restore stored selections', err);
    }
  }, []);

  const hasResults = useMemo(() => results.length > 0, [results]);
  const workoutOptions = useMemo(
    () =>
      results.map((item, index) => ({
        key: `${index}`,
        label: item.name || `Option ${index + 1}`,
        description: item.activity ? `${item.activity}${item.duration_minutes ? ` · ${item.duration_minutes} min` : ''}` : undefined,
        data: item,
      })),
    [results],
  );
  const selectedWorkout = useMemo(() => {
    const match = workoutOptions.find((option) => option.key === selectedKey);
    return match?.data ?? null;
  }, [workoutOptions, selectedKey]);

  const runSearch = useCallback(async ({ activityValue, weightValue, durationValue, persist = true }) => {
    setLoading(true);
    try {
      if (persist && typeof window !== 'undefined') {
        const storedPayload = { activity: activityValue };
        if (typeof weightValue === 'number' && Number.isFinite(weightValue)) {
          storedPayload.weight = weightValue;
        }
        if (typeof durationValue === 'number' && Number.isFinite(durationValue)) {
          storedPayload.duration = durationValue;
        }
        window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(storedPayload));
      }

      const payload = { activity: activityValue };
      if (typeof weightValue === 'number') {
        payload.weight = Number(weightValue.toFixed(2));
      }
      if (typeof durationValue === 'number') {
        payload.duration = Math.round(durationValue);
      }

      const response = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const baseMessage = data.error || 'Unable to fetch workout options.';
        const detail = typeof data.details === 'string' && data.details.trim().length
          ? ` Details: ${data.details.trim()}`
          : '';
        throw new Error(`${baseMessage}${detail}`);
      }

      const data = await response.json();
      const list = Array.isArray(data.results) ? data.results : [];
      setResults(list);
      setMealResults([]);
      setMealStatus('');
      setMealError('');

      if (!list.length) {
        setStatus('No activities matched. Try a different keyword.');
      } else {
        setStatus('Pick the workout style that fits what you did.');
      }
    } catch (err) {
      const message = err.message || 'Unexpected error while searching.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    setError('');
    setStatus('');

    const trimmedActivity = activity.trim();
    if (!trimmedActivity) {
      setError('Please enter an activity to search.');
      return;
    }

    const hasWeight = weight !== '';
    const hasDuration = duration !== '';
    const numericWeight = Number(weight);
    const numericDuration = Number(duration);

    if (!hasWeight || !Number.isFinite(numericWeight) || numericWeight <= 0) {
      setError('Weight is required. Go back to update it.');
      return;
    }

    if (!hasDuration || !Number.isFinite(numericDuration) || numericDuration <= 0) {
      setError('Duration is required. Go back to update it.');
      return;
    }

    setResults([]);
    setMealResults([]);
    setMealStatus('');
    setMealError('');
    await runSearch({
      activityValue: trimmedActivity,
      weightValue: Number(numericWeight.toFixed(2)),
      durationValue: Math.round(numericDuration),
      persist: true,
    });
  };

  useEffect(() => {
    if (!shouldAutoSearch) return;

    setShouldAutoSearch(false);

    const trimmedActivity = activity.trim();
    if (!trimmedActivity) {
      return;
    }

    const numericWeight = Number(weight);
    const numericDuration = Number(duration);

    const validWeight = weight !== '' && Number.isFinite(numericWeight) && numericWeight > 0
      ? Number(numericWeight.toFixed(2))
      : undefined;
    const validDuration = duration !== '' && Number.isFinite(numericDuration) && numericDuration > 0
      ? Math.round(numericDuration)
      : undefined;

    if (validWeight == null || validDuration == null) {
      setStatus('Weight and duration are required. Go back to update them.');
      return;
    }

    setError('');
    setStatus('');
    setResults([]);
    setMealResults([]);
    setMealStatus('');
    setMealError('');

    void runSearch({
      activityValue: trimmedActivity,
      weightValue: validWeight,
      durationValue: validDuration,
      persist: false,
    });
  }, [shouldAutoSearch, activity, weight, duration, runSearch]);

  useEffect(() => {
    setMealResults([]);
    setMealStatus('');
    setMealError('');
  }, [selectedKey]);

  useEffect(() => {
    if (!workoutOptions.length) {
      setSelectedKey(null);
      return;
    }

    setSelectedKey((prev) => {
      if (prev && workoutOptions.some((option) => option.key === prev)) {
        return prev;
      }

      if (initialVariant) {
        const match = workoutOptions.find(
          (option) => option.data?.name?.toLowerCase() === initialVariant.toLowerCase(),
        );
        if (match) {
          return match.key;
        }
      }

      return workoutOptions[0].key;
    });
  }, [workoutOptions, initialVariant]);

  const handleFindMeals = async () => {
    setMealError('');
    setMealStatus('');

    const trimmedActivity = activity.trim();
    if (!trimmedActivity) {
      setMealError('Search for an activity first.');
      return;
    }

    if (!selectedWorkout) {
      setMealError('Pick the specific workout variation.');
      return;
    }

    const numericWeight = Number(weight);
    const numericDuration = Number(duration);

    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setMealError('Enter your weight to personalize calories.');
      return;
    }

    if (!Number.isFinite(numericDuration) || numericDuration <= 0) {
      setMealError('Enter how long you worked out.');
      return;
    }

    const caloriesFromResult = Number(selectedWorkout.total_calories);
    const caloriesPerHour = Number(selectedWorkout.calories_per_hour);
    const derivedTotal = Number.isFinite(caloriesFromResult) && caloriesFromResult > 0
      ? Math.round(caloriesFromResult)
      : (Number.isFinite(caloriesPerHour) && caloriesPerHour > 0
        ? Math.round((caloriesPerHour / 60) * numericDuration)
        : NaN);

    if (!Number.isFinite(derivedTotal) || derivedTotal <= 0) {
      setMealError('Unable to calculate calories for this workout. Try running the search again.');
      return;
    }

    setMealLoading(true);
    try {
      const queries = [selectedWorkout.activity, selectedWorkout.name].filter(Boolean);

      const response = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCalories: derivedTotal, queries }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to fetch meal ideas.');
      }

      const data = await response.json();
      const meals = Array.isArray(data.results) ? data.results : [];
      const targetCaloriesFromResponse = Number(data.targetCalories ?? derivedTotal);
      setMealResults(meals);
      setMealStatus(
        meals.length
          ? `Meals matched to ~${targetCaloriesFromResponse} calories.`
          : 'No close matches—try another activity or adjust time.',
      );

      if (typeof window !== 'undefined') {
        setInitialVariant(selectedWorkout.name ?? '');
        const payload = {
          activity: trimmedActivity,
          variant: selectedWorkout.name,
          caloriesPerHour: selectedWorkout.calories_per_hour ?? null,
          totalCalories: derivedTotal,
          duration: numericDuration,
          weight: numericWeight,
          metadata: {
            mets: selectedWorkout.met ?? null,
            category: selectedWorkout.activity ?? null,
          },
        };
        window.localStorage.setItem(WORKOUT_KEY, JSON.stringify(payload));
      }
    } catch (err) {
      setMealError(err.message || 'Unexpected error while matching meals.');
    } finally {
      setMealLoading(false);
    }
  };

  return (
    <main className="min-h-screen text-slate-100">
      <div className="flex min-h-screen flex-col items-center justify-start p-6">
        <section className="w-full max-w-5xl mt-8">
          {/* Enhanced glowing border effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-3xl blur-2xl opacity-15 animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/50 via-emerald-500/50 to-emerald-400/50 rounded-2xl blur-lg opacity-25" />
          
          <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-2xl p-10 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/8 via-white/3 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-400/5" />
            
            <div className="relative">
              {/* Enhanced Header */}
              <div className="flex items-start justify-between mb-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent mb-4">
                    Choose Your Workout Details
                  </h1>
                  <p className="text-xl text-slate-300 leading-relaxed max-w-3xl font-light">
                    Refine the activity you searched for and add your weight & duration to personalize calorie burn calculations.
                  </p>
                </div>
                <Link 
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800/60 backdrop-blur-sm text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-all duration-300 border border-slate-700/60 hover:border-slate-600/80 hover:shadow-lg hover:shadow-emerald-500/10"
                  href="/"
                >
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Change activity
                </Link>
              </div>

              {/* Enhanced Activity Info Card */}
              <div className="mb-10 relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 rounded-2xl blur-lg" />
                <div className="relative p-8 rounded-2xl bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-slate-700/40 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-lg" />
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">Activity from previous step</p>
                      <p className="text-2xl font-bold text-emerald-300 mt-1">
                        {activity || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Form */}
              <div className="space-y-10">
                {/* Workout Selection */}
                <div className="space-y-5">
                  <label className="block">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-200">
                        Exact workout variation
                      </span>
                    </div>
                    <div className="relative">
                      <Autocomplete
                        className="w-full"
                        placeholder={hasResults ? 'Select the closest match to your workout' : 'Search to load workout options'}
                        isDisabled={!hasResults}
                        variant="bordered"
                        color="success"
                        classNames={{
                          base: 'text-slate-100',
                          label: 'text-slate-200',
                          mainWrapper: 'bg-slate-950',
                          inputWrapper: 'rounded-xl bg-slate-950/60 backdrop-blur-sm border border-slate-600/60 data-[hover=true]:border-emerald-500/70 data-[focus=true]:border-emerald-500 data-[focus=true]:ring-4 data-[focus=true]:ring-emerald-500/20 transition-all duration-300 data-[focus=true]:shadow-lg data-[focus=true]:shadow-emerald-500/10',
                          input: 'text-slate-100 placeholder:text-slate-400 text-base p-4',
                          listboxWrapper: 'bg-slate-900 rounded-xl',
                          listbox: 'bg-slate-900 text-slate-100',
                          popoverContent: 'bg-slate-900 text-slate-100 border border-slate-700/50 rounded-xl backdrop-blur-xl',
                        }}
                        listboxProps={{ className: 'bg-slate-900 text-slate-100' }}
                        popoverProps={{ className: 'bg-slate-900 text-slate-100 border border-slate-700/50 rounded-xl backdrop-blur-xl' }}
                        selectedKey={selectedKey ?? undefined}
                        onSelectionChange={(key) => {
                          if (key == null) {
                            setSelectedKey(null);
                          } else {
                            setSelectedKey(String(key));
                          }
                        }}
                        allowsCustomValue={false}
                        defaultItems={workoutOptions}
                      >
                        {(item) => (
                          <AutocompleteItem
                            key={item.key}
                            textValue={item.label}
                            className="bg-slate-900 text-slate-100 data-[hover=true]:bg-emerald-500/20 rounded-lg transition-colors duration-200"
                          >
                            <div className="flex flex-col py-2">
                              <span className="font-medium text-base">{item.label}</span>
                              {item.description && (
                                <span className="text-sm text-slate-400 mt-1">{item.description}</span>
                              )}
                            </div>
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 transition-opacity duration-300 focus-within:opacity-100" />
                    </div>
                  </label>
                </div>

                {/* Enhanced Weight and Duration Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-emerald-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
                    <div className="relative rounded-2xl border border-slate-700/60 bg-slate-950/60 backdrop-blur-sm p-8 transition-all duration-300 group-hover:border-slate-600/80 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md" />
                          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-400/30 flex items-center justify-center border border-emerald-500/30">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100">Weight</h3>
                      </div>
                      <p className="text-3xl font-bold text-emerald-300 mb-2">
                        {weight ? `${weight} lbs` : 'Not set'}
                      </p>
                      {!weight && (
                        <p className="text-sm text-slate-400">Go back to update</p>
                      )}
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-emerald-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
                    <div className="relative rounded-2xl border border-slate-700/60 bg-slate-950/60 backdrop-blur-sm p-8 transition-all duration-300 group-hover:border-slate-600/80 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md" />
                          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-400/30 flex items-center justify-center border border-emerald-500/30">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100">Duration</h3>
                      </div>
                      <p className="text-3xl font-bold text-emerald-300 mb-2">
                        {duration ? `${duration} min` : 'Not set'}
                      </p>
                      {!duration && (
                        <p className="text-sm text-slate-400">Go back to update</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <button
                    className="group relative overflow-hidden rounded-xl bg-slate-800/60 backdrop-blur-sm border border-slate-600/60 px-8 py-4 text-base font-semibold text-slate-200 transition-all duration-300 hover:bg-slate-700/60 hover:border-slate-500/80 hover:text-white hover:shadow-lg hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-800/60 disabled:hover:border-slate-600/60"
                    disabled={loading || !activity.trim() || !weight || !duration}
                    onClick={handleSearch}
                    type="button"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refreshing…
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh workout options
                        </>
                      )}
                    </span>
                  </button>

                  <button
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 hover:shadow-3xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-emerald-500/20 focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
                    disabled={mealLoading || loading || !selectedWorkout || !weight || !duration}
                    onClick={handleFindMeals}
                    type="button"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center justify-center gap-3">
                      {mealLoading ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Finding meals…
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                          </svg>
                          Find meal matches
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Enhanced Status Messages */}
                {error && (
                  <div className="relative animate-in slide-in-from-top duration-300">
                    <div className="absolute -inset-1 bg-red-500/30 rounded-2xl blur-lg" />
                    <div className="relative rounded-2xl border border-red-500/40 bg-red-500/10 backdrop-blur-sm p-6">
                      <p className="text-base text-red-300 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {status && !error && (
                  <div className="relative animate-in slide-in-from-top duration-300">
                    <div className="absolute -inset-1 bg-emerald-500/30 rounded-2xl blur-lg" />
                    <div className="relative rounded-2xl border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-sm p-6">
                      <p className="text-base text-emerald-300 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {status}
                      </p>
                    </div>
                  </div>
                )}

                {mealError && (
                  <div className="relative animate-in slide-in-from-top duration-300">
                    <div className="absolute -inset-1 bg-red-500/30 rounded-2xl blur-lg" />
                    <div className="relative rounded-2xl border border-red-500/40 bg-red-500/10 backdrop-blur-sm p-6">
                      <p className="text-base text-red-300 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {mealError}
                      </p>
                    </div>
                  </div>
                )}

                {mealStatus && !mealError && (
                  <div className="relative animate-in slide-in-from-top duration-300">
                    <div className="absolute -inset-1 bg-emerald-500/30 rounded-2xl blur-lg" />
                    <div className="relative rounded-2xl border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-sm p-6">
                      <p className="text-base text-emerald-300 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {mealStatus}
                      </p>
                    </div>
                  </div>
                )}

                {/* Enhanced Meal Results */}
                {mealResults.length > 0 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/30 rounded-lg blur-lg" />
                        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-100">Meal Matches</h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {mealResults.map((meal, index) => (
                        <div
                          className="group relative"
                          key={`${meal.food_id ?? 'food'}-${index}`}
                        >
                          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-emerald-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
                          <div className="relative rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur-sm p-8 transition-all duration-300 group-hover:border-slate-600/80 group-hover:shadow-lg group-hover:shadow-emerald-500/10 group-hover:-translate-y-1">
                            <h4 className="text-xl font-bold text-slate-100 mb-4 group-hover:text-emerald-200 transition-colors duration-300">{meal.name}</h4>
                            <div className="space-y-3">
                              <p className="text-sm text-slate-300 flex items-center gap-3">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {meal.kcal_per_100 ? `${meal.kcal_per_100} calories / 100g` : 'Calories vary by serving'}
                              </p>
                              {meal.estimated_calories && (
                                <div className="relative">
                                  <div className="absolute -inset-1 bg-emerald-500/10 rounded-lg blur" />
                                  <div className="relative p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                    <p className="text-sm text-emerald-300 flex items-center gap-3 font-medium">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Suggested portion ≈ {meal.suggested_portion_grams ? `${meal.suggested_portion_grams}g` : `${meal.suggested_servings} servings`} ({meal.estimated_calories} calories)
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
