import { NextResponse } from 'next/server';

const API_BASE = 'https://api.api-ninjas.com/v1/caloriesburned';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const activity = body?.activity?.trim();
  const weight = body?.weight;
  const duration = body?.duration;

  if (!activity) {
    return NextResponse.json({ error: 'Activity is required.' }, { status: 400 });
  }

  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not configured.' }, { status: 500 });
  }

  const params = new URLSearchParams({ activity });
  if (typeof weight === 'number' && Number.isFinite(weight) && weight > 0) {
    params.set('weight', String(weight));
  }
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    params.set('duration', String(duration));
  }

  try {
    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: {
        'X-Api-Key': apiKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch activity data.', details: text },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json({ results: Array.isArray(data) ? data : [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected server error.', details: error.message },
      { status: 500 },
    );
  }
}
