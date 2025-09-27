// test.js
// Usage: node test.js <activity> [weight_lbs] [duration_minutes] [window]
// Default window ±100 kcal. If no hits, show closest 5 and suggest portion size.
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execFileP = promisify(execFile);
const FOOD_SCRIPT = path.resolve(__dirname, 'food_api.js');

const NINJAS_BASE = 'https://api.api-ninjas.com/v1/caloriesburned';
const FATSECRET_BASE = 'https://platform.fatsecret.com/rest/server.api';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const parseLooseJSON = s => JSON.parse(s.slice(s.indexOf('{')));
const within = (item, target, win) => {
  const val = Number(item.serving_calories ?? item.kcal_per_100);
  return Number.isFinite(val) && Math.abs(val - target) <= win;
};

async function httpGetJSON(url, params = {}, headers = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(qs ? `${url}?${qs}` : url, { headers });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt);
  return JSON.parse(txt);
}

async function getActivityOptions(activity, weight = 160, duration = 30) {
  const key = process.env.API_NINJAS_KEY;
  if (!key) throw new Error('Set API_NINJAS_KEY');
  return httpGetJSON(NINJAS_BASE, { activity, weight, duration }, { 'X-Api-Key': key });
}

// --- FatSecret fallback (minimal, only if food_api.js fails)
function makeSigner() {
  const CK = process.env.FATSECRET_CONSUMER_KEY;
  const CS = process.env.FATSECRET_CONSUMER_SECRET;
  if (!CK || !CS) throw new Error('Set FATSECRET_CONSUMER_KEY and FATSECRET_CONSUMER_SECRET');
  const oauth = OAuth({
    consumer: { key: CK, secret: CS },
    signature_method: 'HMAC-SHA1',
    hash_function(base, key) { return crypto.createHmac('sha1', key).update(base).digest('base64'); },
  });
  return params => oauth.authorize({ url: FATSECRET_BASE, method: 'GET', data: params });
}
async function foodsSearchOAuth1(query, sign) {
  const base = { method: 'foods.search', format: 'json', search_expression: query, max_results: 50, page_number: 0 };
  const auth = sign(base);
  const data = await httpGetJSON(FATSECRET_BASE, { ...base, ...auth });
  const f = data?.foods?.food;
  return Array.isArray(f) ? f : f ? [f] : [];
}
function extractCaloriesArray(food) {
  const s = food?.servings?.serving;
  const list = Array.isArray(s) ? s : s ? [s] : [];
  return list.map(v => Number(v.calories)).filter(Number.isFinite);
}
function closest(arr, target) {
  return arr.reduce((a, c) => Math.abs(c - target) < Math.abs(a - target) ? c : a);
}
function rankTopFoods(catalog, target, k = 10) {
  const byId = {};
  for (const it of catalog) {
    const best = closest(it.servingCalories, target);
    const diff = Math.abs(best - target);
    const prev = byId[it.id];
    if (!prev || diff < prev.diff) byId[it.id] = { food_id: it.id, name: it.name, kcal_per_100: best, diff };
  }
  return Object.values(byId).sort((a, b) => a.diff - b.diff).slice(0, k);
}

// --- call your existing food_api.js without filtering, then filter here
async function foodsFromLocalScript(target, attempts = 3) {
  for (let a = 0; a < attempts; a++) {
    try {
      const { stdout } = await execFileP('node', [FOOD_SCRIPT, String(target)], { timeout: 60_000 });
      const data = parseLooseJSON(stdout);
      if (Array.isArray(data.results) && data.results.length) return data.results;
    } catch {}
    await sleep(600 * Math.pow(2, a));
  }
  return [];
}
async function fallbackFoods(target) {
  try {
    const sign = makeSigner();
    const seeds = ['chicken', 'egg', 'rice'];
    const catalog = [];
    for (const q of seeds) {
      const foods = await foodsSearchOAuth1(q, sign);
      for (const f of foods) {
        const cals = extractCaloriesArray(f);
        if (cals.length) catalog.push({ id: f.food_id, name: f.food_name, servingCalories: cals });
      }
      await sleep(600);
    }
    return rankTopFoods(catalog, target, 10);
  } catch { return []; }
}

// --- compute portion suggestion to hit target
function withPortionSuggestion(item, target) {
  const out = { ...item };
  const per100 = Number(item.kcal_per_100);
  const perServing = Number(item.serving_calories);
  if (Number.isFinite(per100) && per100 > 0) {
    const grams = Math.round((target / per100) * 100);
    const cals = Math.round((grams * per100) / 100);
    out.suggested_portion_grams = grams;
    out.estimated_calories = cals;
  } else if (Number.isFinite(perServing) && perServing > 0) {
    const servings = Math.round((target / perServing) * 100) / 100;
    const cals = Math.round(servings * perServing);
    out.suggested_servings = servings;
    out.estimated_calories = cals;
  }
  return out;
}

// --- interactive flow
const activity = process.argv[2];
const weight = Number(process.argv[3] ?? 160);
const duration = Number(process.argv[4] ?? 30);
const windowCal = Number(process.argv[5] ?? 100);

if (!activity || Number.isNaN(weight) || Number.isNaN(duration)) {
  console.error('Usage: node test.js <activity> [weight_lbs] [duration_minutes] [window]');
  process.exit(1);
}

const options = await getActivityOptions(activity, weight, duration);
if (!options.length) { console.error('No activity options.'); process.exit(1); }

console.log(`Activity: ${activity} | weight ${weight} lb | duration ${duration} min | window ±${windowCal} kcal`);
options.forEach((o, i) => console.log(`${i + 1}. ${o.name} - ${o.total_calories} kcal (per hr ${o.calories_per_hour})`));

const rl = createInterface({ input, output });
const pick = await rl.question('Pick an option number: ');
await rl.close();

const idx = Number(pick) - 1;
if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) { console.error('Invalid selection.'); process.exit(1); }

const chosen = options[idx];
const target = Number(chosen.total_calories);

// 1) get unfiltered foods
let foods = await foodsFromLocalScript(target);
if (!foods.length) foods = await fallbackFoods(target);

// 2) window filter; if none, show closest 5 and add portion suggestions
const filtered = foods.filter(x => within(x, target, windowCal)).slice(0, 5);
const finalList = (filtered.length ? filtered : foods.slice(0, 5)).map(it => withPortionSuggestion(it, target));

console.log(JSON.stringify({
  activity,
  weight_lbs: weight,
  duration_minutes: duration,
  chosen_option: {
    name: chosen.name,
    calories_per_hour: chosen.calories_per_hour,
    total_calories: target,
  },
  top_foods: finalList
}, null, 2));
