// pick_and_match.js
// Usage: node pick_and_match.js <activity> [weight_lbs] [duration_minutes]
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOOD_SCRIPT = path.resolve(__dirname, 'food_api.js');
const NINJAS_BASE = 'https://api.api-ninjas.com/v1/caloriesburned';

async function getActivityOptions(activity, weight = 160, duration = 30) {
  const key = process.env.API_NINJAS_KEY;
  if (!key) throw new Error('Set API_NINJAS_KEY');
  const url = new URL(NINJAS_BASE);
  url.searchParams.set('activity', activity);
  url.searchParams.set('weight', String(weight));
  url.searchParams.set('duration', String(duration));
  const res = await fetch(url, { headers: { 'X-Api-Key': key } });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt);
  return JSON.parse(txt);
}

async function foodsForCalories(target) {
  const { stdout } = await execFileP('node', [FOOD_SCRIPT, String(target)], { timeout: 60_000 });
  const jsonStart = stdout.indexOf('{');
  const data = JSON.parse(jsonStart >= 0 ? stdout.slice(jsonStart) : stdout);
  return Array.isArray(data.results) ? data.results : [];
}

const activity = process.argv[2] || 'running';
const weight = Number(process.argv[3] ?? 160);
const duration = Number(process.argv[4] ?? 30);

const options = await getActivityOptions(activity, weight, duration);
if (!options.length) {
  console.error('No activity options returned.');
  process.exit(1);
}

console.log(`Activity: ${activity} | weight ${weight} lb | duration ${duration} min`);
options.forEach((o, i) => {
  console.log(`${i + 1}. ${o.name} - ${o.total_calories} kcal (per hr ${o.calories_per_hour})`);
});

const rl = createInterface({ input, output });
const pick = await rl.question('Pick an option number: ');
rl.close();

const idx = Number(pick) - 1;
if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
  console.error('Invalid selection.');
  process.exit(1);
}

const chosen = options[idx];
const foods = await foodsForCalories(Number(chosen.total_calories));

console.log(JSON.stringify({
  activity,
  weight_lbs: weight,
  duration_minutes: duration,
  chosen_option: {
    name: chosen.name,
    calories_per_hour: chosen.calories_per_hour,
    total_calories: Number(chosen.total_calories),
  },
  top_foods: foods
}, null, 2));
