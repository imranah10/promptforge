// Shared Upstash Redis REST helper used by all subscription endpoints.
// Keeps the per-route code tiny and consistent with the existing
// api/active-users.js pattern.
//
// Required env vars (set in Vercel project settings):
//   UPSTASH_REDIS_REST_URL   e.g. https://xxx-xxx.upstash.io
//   UPSTASH_REDIS_REST_TOKEN

export const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
export const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function redisConfigured() {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

/**
 * Run a single Redis command via the REST API.
 * @returns {Promise<any>} the `result` field from Upstash
 */
export async function redisCmd(...args) {
  if (!redisConfigured()) throw new Error('Redis not configured');

  const res = await fetch(`${REDIS_URL}/${args[0].toLowerCase()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args.slice(1)),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Redis error: ${txt}`);
  }
  const json = await res.json();
  return json.result;
}

/**
 * Run a pipeline of commands (atomic batch). Each entry is an array of args.
 * @returns {Promise<Array>} array of { result } objects
 */
export async function redisPipeline(commands) {
  if (!redisConfigured()) throw new Error('Redis not configured');

  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Redis pipeline error: ${txt}`);
  }
  return res.json();
}

// ── Standard CORS headers for cross-origin calls from the browser ────────
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Accept, Content-Type'
  );
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// ── Plan catalogue (single source of truth for backend + frontend) ───────
// These IDs map to Razorpay subscription plans. Replace with your real plan
// IDs from the Razorpay dashboard → Products → Subscriptions → Plans.
export const PLANS = {
  pro: {
    id: 'plan_pro',
    name: 'Pro',
    price: 1900, // ₹19/mo in paise (Razorpay takes INR in paise)
    currency: 'INR',
    interval: 'monthly',
    features: [
      'All 10+ AI models',
      'Unlimited generations',
      'Creator Studio (all platforms)',
      'Model Comparison',
      'Code Helper',
      '50+ languages',
    ],
  },
  agency: {
    id: 'plan_agency',
    name: 'Agency',
    price: 4900, // ₹49/mo in paise
    currency: 'INR',
    interval: 'monthly',
    features: [
      'Everything in Pro',
      'White-label rights',
      '5 team seats',
      'Priority support',
      'Reseller license',
      'Custom branding',
    ],
  },
  lifetime: {
    id: 'plan_lifetime',
    name: 'Founders (Lifetime)',
    price: 4900, // ₹49 one-time
    currency: 'INR',
    interval: 'lifetime',
    features: [
      'Everything in Agency',
      'One-time payment',
      'Lifetime updates',
      'No monthly fees ever',
    ],
  },
};

export function getPlan(planId) {
  return PLANS[planId] || null;
}
