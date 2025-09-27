// food_api.js  (ESM; your package.json has "type": "module")
import 'dotenv/config';
import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET;
if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  throw new Error('Missing FATSECRET_CONSUMER_KEY or FATSECRET_CONSUMER_SECRET');
}

const BASE = 'https://platform.fatsecret.com/rest/server.api';

// OAuth 1.0 HMAC-SHA1 signing (2-legged; no user token)
const oauth = OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(base, key) {
    return crypto.createHmac('sha1', key).update(base).digest('base64');
  },
});
function sign(params) {
  const req = { url: BASE, method: 'GET', data: params };
  return oauth.authorize(req);
}

// v1/v2 search (stable and widely available)
async function foodsSearch(query, max_results = 50, page_number = 0) {
  const params = {
    method: 'foods.search',
    format: 'json',
    search_expression: query,
    max_results,
    page_number,
  };
  const auth = sign(params);
  const resp = await axios.get(BASE, { params: { ...params, ...auth } });
  return resp.data;
}

// get detailed servings to read metric amount/unit and calories
async function foodGet(food_id) {
  const params = { method: 'food.get', format: 'json', food_id };
  const auth = sign(params);
  const resp = await axios.get(BASE, { params: { ...params, ...auth } });
  return resp.data;
}

// kcal per 100 g/ml from a serving record
function kcalPer100(serv) {
  const amt = Number(serv.metric_serving_amount);
  const unit = serv.metric_serving_unit; // "g" or "ml"
  const kcal = Number(serv.calories);
  if (!amt || !kcal || (unit !== 'g' && unit !== 'ml')) return null;
  return kcal * (100 / amt);
}

// choose the normalized kcal closest to target
function bestNormalizedKcal(foodDetail, target) {
  const s = foodDetail.food?.servings?.serving;
  const list = Array.isArray(s) ? s : (s ? [s] : []);
  const vals = list.map(kcalPer100).filter(Number.isFinite);
  if (!vals.length) return null;
  return vals.reduce((a, c) => (Math.abs(c - target) < Math.abs(a - target) ? c : a), vals[0]);
}

async function topFoodsByCalories(targetCalories, queries) {
  const qList = queries?.length
    ? queries
    : ['chicken', 'beef', 'salmon', 'egg', 'rice', 'bread', 'milk', 'pasta', 'potato', 'banana'];

  // search
  const pages = await Promise.all(qList.map(q => foodsSearch(q)));

  // flatten search results; v1/v2 path: foods.food
  const searchFoods = pages.flatMap(p => {
    const arr = p?.foods?.food;
    return Array.isArray(arr) ? arr : arr ? [arr] : [];
  });

  // optional: only Generic foods
  const generic = searchFoods.filter(f => f.food_type === 'Generic');

  // fetch details for each candidate
  const details = await Promise.all(generic.map(f => foodGet(f.food_id)));

  // score
  const scored = details
    .map(d => {
      const kcal = bestNormalizedKcal(d, targetCalories);
      if (kcal == null) return null;
      return {
        food_id: d.food?.food_id,
        name: d.food?.food_name,
        kcal_per_100: Number(kcal.toFixed(0)),
        diff: Math.abs(kcal - targetCalories),
      };
    })
    .filter(Boolean);

  // tolerance band ±50 kcal; fall back to global sort if none match
  const sorted = scored.sort((a, b) => a.diff - b.diff);
  const within = sorted.filter(x => x.diff <= 50);
  const top = (within.length ? within : sorted).slice(0, 5);

  return top;
}

// CLI: node food_api.js 500 "chicken,beef,orange"
(async () => {
  const target = Number(process.argv[2] || '500');
  const queries = (process.argv[3] || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  try {
    const top = await topFoodsByCalories(target, queries);
    console.log(JSON.stringify({ targetCalories: target, results: top }, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();
