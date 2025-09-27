// test.js
// Usage: node test.js <activity> [weight_lbs] [duration_minutes]
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

// ---------- helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));
const parseLooseJSON = (s) => {
  const i = s.indexOf('{');
  return JSON.parse(i >= 0 ? s.slice(i) : s);
};

async function httpGetJSON(url, params = {}, headers = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(qs ? `${url}?${qs}` : url, { headers });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt);
  return JSON.parse(txt);
}

// ---------- API Ninjas
async function getActivityOptions(activity, weight = 160, duration = 30) {
  const key = process.env.API_NINJAS_KEY;
  if (!key) throw new Error('Set API_NINJAS_KEY');
  return httpGetJSON(
    NINJAS_BASE,
    { activity, weight, duration },
    { 'X-Api-Key': key }
  );
}

// ---------- FatSecret fallback (only if food_api.js returns empty)
function makeSigner() {
  const CK = process.env.FATSECRET_CONSUMER_KEY;
  const CS = process.env.FATSECRET_CONSUMER_SECRET;
  if (!CK || !CS) throw new Error('Set FATSECRET_CONSUMER_KEY and FATSECRET_CONSUMER_SECRET');
  const oauth = OAuth({
    consumer: { key: CK, secret: CS },
    signature_method: 'HMAC-SHA1',
    hash_function(base, key) {
      return crypto.createHmac('sha1', key).update(base).digest('base64');
    },
  });
  return (params) => oauth.authorize({ url: FATSECRET_BASE, method: 'GET', data: params });
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
  const out = [];
  for (const sv of list) {
    const cal = Number(sv.calories);
    if (Number.isFinite(cal)) out.push(cal);
  }
  return out;
}

function closest(arr, target) {
  return arr.reduce((a, c) => Math.abs(c - target) < Math.abs(a - target) ? c : a);
}

function rankTopFoods(catalog, target, k = 5) {
  const byId = {};
  for (const it of catalog) {
    const best = closest(it.servingCalories, target);
    const diff = Math.abs(best - target);
    const prev = byId[it.id];
    if (!prev || diff < prev.diff) byId[it.id] = {
      food_id: it.id, name: it.name, kcal_per_100: best, diff
    };
  }
  return Object.values(byId).sort((a, b) => a.diff - b.diff).slice(0, k);
}

async function fallbackFoods(target) {
  // minimal seeds to avoid rate limits
  const seeds = ['chicken', 'egg', 'rice'];
  const sign = makeSigner();
  const catalog = [];
  for (const q of seeds) {
    try {
      const foods = await foodsSearchOAuth1(q, sign);
      for (const f of foods) {
        const cals = extractCaloriesArray(f);
        if (cals.length) {
          catalog.push({ id: f.food_id, name: f.food_name, servingCalories: cals });
        }
      }
      await sleep(600);
    } catch {
      // skip on transient error
    }
  }
  return rankTopFoods(catalog, target, 5);
}

// ---------- wrapper that retries food_api.js then falls back
async function foodsForCaloriesWithRetry(target) {
  // 1) try your existing script up to 3 times with backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { stdout } = await execFileP('node', [FOOD_SCRIPT, String(target)], { timeout: 60_000 });
      const data = parseLooseJSON(stdout);
      if (Array.isArray(data.results) && data.results.length) return data.results;
    } catch {
      // ignore and retry
    }
    await sleep(600 * Math.pow(2, attempt)); // 600ms, 1200ms, 2400ms
  }
  // 2) fallback single FatSecret pass
  return fallbackFoods(target);
}

// ---------- interactive flow
const activity = process.argv[2];
const weight = Number(process.argv[3] ?? 160);
const duration = Number(process.argv[4] ?? 30);

if (!activity || Number.isNaN(weight) || Number.isNaN(duration)) {
  console.error('Usage: node test.js <activity> [weight_lbs] [duration_minutes]');
  process.exit(1);
}

const options = await getActivityOptions(activity, weight, duration);
if (!options.length) {
  console.error('No activity options.');
  process.exit(1);
}

console.log(`Activity: ${activity} | weight ${weight} lb | duration ${duration} min`);
options.forEach((o, i) => {
  console.log(`${i + 1}. ${o.name} - ${o.total_calories} kcal (per hr ${o.calories_per_hour})`);
});

const rl = createInterface({ input, output });
const pick = await rl.question('Pick an option number: ');
await rl.close();
const idx = Number(pick) - 1;
if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
  console.error('Invalid selection.');
  process.exit(1);
}

const chosen = options[idx];
const target = Number(chosen.total_calories);
const foods = await foodsForCaloriesWithRetry(target);

console.log(JSON.stringify({
  activity,
  weight_lbs: weight,
  duration_minutes: duration,
  chosen_option: {
    name: chosen.name,
    calories_per_hour: chosen.calories_per_hour,
    total_calories: target,
  },
  top_foods: foods
}, null, 2));
