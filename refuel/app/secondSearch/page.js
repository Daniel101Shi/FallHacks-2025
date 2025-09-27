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
    <main className="flex min-h-screen flex-col items-center justify-start bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-3xl rounded-lg border border-slate-800 bg-slate-900 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">Choose Your Workout Details</h1>
        <p className="mt-2 text-sm text-slate-300">
          Refine the activity you searched for and add your weight & duration to personalize calorie burn.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
          <span>
            Activity from previous step:
            <span className="ml-1 font-medium text-slate-100">{activity || 'Not set'}</span>
          </span>
          <Link className="text-emerald-400 hover:text-emerald-300" href="/">
            Change activity
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Autocomplete
              className="w-full"
              label="Exact workout"
              placeholder={hasResults ? 'Select the closest match' : 'Search to load workout options'}
              isDisabled={!hasResults}
              variant="bordered"
              color="success"
              classNames={{
                base: 'text-slate-100',
                label: 'text-slate-200',
                mainWrapper: 'bg-slate-950',
                inputWrapper:
                  'bg-slate-950 border border-slate-700 data-[hover=true]:border-emerald-500 data-[focus=true]:border-emerald-500',
                input: 'text-slate-100 placeholder:text-slate-500',
                listboxWrapper: 'bg-slate-900',
                listbox: 'bg-slate-900 text-slate-100',
                popoverContent: 'bg-slate-900 text-slate-100 border border-slate-800',
              }}
              listboxProps={{ className: 'bg-slate-900 text-slate-100' }}
              popoverProps={{ className: 'bg-slate-900 text-slate-100 border border-slate-800' }}
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
                  className="bg-slate-900 text-slate-100 data-[hover=true]:bg-emerald-500/20"
                >
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-slate-400">{item.description}</span>
                    )}
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>
          </div>

          <div className="rounded-md border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
            <p className="font-medium text-slate-100">Weight</p>
            <p>{weight ? `${weight} lbs` : 'Not set — go back to update.'}</p>
          </div>

          <div className="rounded-md border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
            <p className="font-medium text-slate-100">Duration</p>
            <p>{duration ? `${duration} minutes` : 'Not set — go back to update.'}</p>
          </div>

          <button
            className="md:col-span-2 rounded-md bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-600/40"
            disabled={loading || !activity.trim() || !weight || !duration}
            onClick={handleSearch}
            type="button"
          >
            {loading ? 'Refreshing…' : 'Refresh workout options'}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {status && !error && (
          <p className="mt-4 text-sm text-emerald-400" role="status">
            {status}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
          <button
            className="rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-600/40"
            disabled={mealLoading || loading || !selectedWorkout || !weight || !duration}
            onClick={handleFindMeals}
            type="button"
          >
            {mealLoading ? 'Finding meals…' : 'Find meal matches'}
          </button>
        </div>

        {mealError && (
          <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {mealError}
          </p>
        )}

        {mealStatus && !mealError && (
          <p className="mt-4 text-sm text-emerald-400" role="status">
            {mealStatus}
          </p>
        )}

        {mealResults.length > 0 && (
          <ul className="mt-6 space-y-4">
            {mealResults.map((meal, index) => (
              <li
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                key={`${meal.food_id ?? 'food'}-${index}`}
              >
                <h3 className="text-lg font-medium">{meal.name}</h3>
                <p className="text-sm text-slate-300">
                  {meal.kcal_per_100 ? `${meal.kcal_per_100} kcal / 100g` : 'Calories vary by serving'}
                </p>
                {meal.estimated_calories && (
                  <p className="text-sm text-emerald-400">
                    Suggested portion ≈ {meal.suggested_portion_grams ? `${meal.suggested_portion_grams} g` : `${meal.suggested_servings} servings`} ({meal.estimated_calories} kcal)
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
