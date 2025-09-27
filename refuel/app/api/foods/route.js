import { NextResponse } from 'next/server';
import { findFoodsByCalories } from '../../../test_apis/food_api.js';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const totalCalories = Number(body?.targetCalories);
  const queries = Array.isArray(body?.queries)
    ? body.queries.flatMap((entry) => {
        if (typeof entry === 'string') return entry.trim() ? [entry.trim()] : [];
        return [];
      })
    : [];

  if (!Number.isFinite(totalCalories) || totalCalories <= 0) {
    return NextResponse.json({ error: 'targetCalories must be a positive number.' }, { status: 400 });
  }

  try {
    const results = await findFoodsByCalories(totalCalories, queries);
    return NextResponse.json({ targetCalories: totalCalories, results: Array.isArray(results) ? results : [] });
  } catch (error) {
    const message = error?.response?.data || error.message || 'Failed to fetch meal options.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
