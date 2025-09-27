'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/* ---------- CONTENT ---------- */
const data = {
  brand: 'Refuel',
  headline: 'About Refuel',
  strap: 'Lose some. Refuel well. Stay sane.',
  mission:
    'Refuel is the smart way to live your life as you will test out the flip side. Useful two-step: get a bit lighter on purpose, then bring back the good weight—also on purpose. Phase one trims the fluff. Phase two invites your back... back.',
  loseList: [
    'Watch your diet and workout often',
    'Be motivated and driven',
  ],
  refuelList: [
    'Eat, eat, eat, and eat (reverse-diet style)',
    'Healthy and Balanced diet; only carbs',
  ],
  features: [
    'It shows the duality of ones anatomy',
  ],
  email: 'hello@tryrefuel.example',
  tips: [
    'Fried Chicken',
    'Lays Chips',
    'Hotdog',
    'Bigway',
    'Crumbl Cookies',
    'Mcdonalds burger and fries',
  ],
};

const HERO_SRC = '/images/refuel-hero.jpg'; // put an image at public/images/refuel-hero.jpg

/* ---------- UTIL ---------- */
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ---------- PERSONALIZATION ---------- */
function useProfile() {
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    const raw = ls.get('refuel.profile');
    if (raw) { try { setProfile(JSON.parse(raw)); } catch { setShowModal(true); } }
    else setShowModal(true);
  }, []);
  const save = (p) => { setProfile(p); ls.set('refuel.profile', JSON.stringify(p)); setShowModal(false); };
  return { profile, showModal, setShowModal, save };
}

/* ---------- PAGE ---------- */
export default function AboutPage() {
  const [dark, setDark] = useState(false);
  useEffect(() => { if (ls.get('refuel.dark') === '1') setDark(true); }, []);
  useEffect(() => { ls.set('refuel.dark', dark ? '1' : '0'); }, [dark]);

  const { profile, showModal, setShowModal, save } = useProfile();
  const [heroRef, heroIn] = useInView(0.1);

  // Tips (diet-aware, keeps your original behavior)
  const dietTips = useMemo(() => {
    const veg = [
      'Refuel: Ice cream',
      'Drink: coke, monster, redbull',
      'Snack: Chips',
    ];
    if (profile?.diet === 'vegetarian' || profile?.diet === 'vegan') {
      return [...veg, ...data.tips.filter(t => !/salmon|cottage|whey/i.test(t))];
    }
    return data.tips;
  }, [profile]);

  const [tip, setTip] = useState('Click "Refuel Tip" for a food idea.');
  const pickTip = () => setTip(dietTips[Math.floor(Math.random() * dietTips.length)]);

  // Hero image fallback (fixes missing image/alt text issues)
  const [heroOk, setHeroOk] = useState(true);

  const greet = profile?.name ? `Hi ${profile.name},` : 'Hi,';
  const focus = profile?.focus === 'refuel' ? 'rebuild smart' : 'lose safely';

  return (
    <main className={`theme ${dark ? 'dark' : ''}`}>
      {/* HERO with robust image fallback */}
      <section ref={heroRef} className={`hero ${heroIn ? 'in' : ''}`}>
        <div className="hero-media">
          {heroOk ? (
            <img
              className="hero-poster"
              src={HERO_SRC}
              alt="Refuel training montage"
              onError={() => setHeroOk(false)}
            />
          ) : (
            <div className="hero-fallback" aria-hidden="true" />
          )}
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <span className="badge" aria-hidden="true">Lose → Refuel Combo</span>
          <h1 className="hero-title">{data.brand}</h1>
          <p className="hero-strap">{data.strap}</p>
          <div className="hero-cta">
            <button className="btn accent" onClick={() => setShowModal(true)}>Plan My Refuel</button>
            <button className="btn ghost" onClick={() => setShowModal(true)}>Personalize</button>
          </div>
        </div>
      </section>

      <div className="container reveal in">
        {/* Header */}
        <header role="banner" className="header">
          <div className="brand">
            <div className="logo" aria-hidden="true">R</div>
            <div>
              <div className="kicker" aria-label={`${data.brand} tagline`}>{data.strap}</div>
              <h2 id="page-title">{data.headline}</h2>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn secondary" aria-pressed={dark ? 'true' : 'false'} onClick={() => setDark(d => !d)}>🌙</button>
            <button className="btn" onClick={() => setShowModal(true)}>⚙️</button>
          </div>
        </header>

        {/* STACKED CARDS */}
        <section className="stack" role="region" aria-labelledby="page-title">
          <Reveal>
            <article className="card" role="article">
              <span className="pill" aria-hidden="true">About {data.brand}</span>
              <p><strong>{greet}</strong> we help you {focus}. {data.mission}</p>
              <div className="cta">
                <button className="btn" onClick={() => alert('Coming soon: quick onboarding quiz!')}>Gain Back Those Pounds</button>
              </div>
            </article>
          </Reveal>

          <Reveal>
            <aside className="card" role="complementary" aria-label="Refuel tips">
              <h3>Quick Refuel Ideas (for the comeback)</h3>
              <p>Tiny and healthy meals keep energy up without too much overload. Try one:</p>
              <div className="tip-box">{tip}</div>
              <div className="cta"><button className="btn" onClick={pickTip}>Refuel Tip</button></div>
            </aside>
          </Reveal>

          <Reveal>
            <section className="card" role="region" aria-label="How Refuel works">
              <h3>How the Two-Step Works</h3>
              <span className="badge" aria-hidden="true">Lose → Refuel</span>
              <div className="phase">
                <strong>Phase 1 — Lose The Pounds</strong>
                <p>Use your grit and hardwork to loose weight via Refuel</p>
                <ul>{data.loseList.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
              <div className="phase">
                <strong>Phase 2 — Reverse on it </strong>
                <p>Succumb to temptation</p>
                <ul>{data.refuelList.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="card" role="region" aria-label="Key features">
              <h3>Why this works</h3>
              <ul>{data.features.map((f) => <li key={f}>{f}</li>)}</ul>
            </section>
          </Reveal>

          <Reveal>
            <section className="card" id="contact" role="region" aria-label="Contact Refuel">
              <h3>Contact</h3>
              <p> Email: <a className="link" href={`mailto:${data.email}`}>{data.email}</a> </p>
            </section>
          </Reveal>
        </section>

        <footer>© {new Date().getFullYear()} {data.brand}. All rights reserved.</footer>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Personalize Refuel">
            <h3>Personalize Refuel</h3>
            <ProfileForm initial={profile} onCancel={() => setShowModal(false)} onSave={save} />
          </div>
        </div>
      )}

      {/* ---------- STYLES (kept; with fixes) ---------- */}
      <style jsx>{`
        .theme{
          --bg:#f7fbf8; --fg:#1f2a24; --muted:#6a746f; --primary:#28a06d;
          --accent:#0ea5e9; --card:#ffffff; --ring:rgba(40,160,109,.28);
          --measure: 95ch; background:var(--bg); color:var(--fg);
          font-size:18px; line-height:1.9;
        }
        .theme.dark{ --bg:#0c1210; --fg:#e8f1ee; --muted:#9fb0a9; --card:#0f1614; --ring:rgba(53,198,138,.35); }

        /* HERO */
        .hero{position:relative; min-height:50vh; overflow:hidden; display:grid; place-items:center;}
        .hero-media{position:absolute; inset:0;}
        .hero-poster{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block;}
        .hero-fallback{position:absolute; inset:0;
          background:
            radial-gradient(1200px 500px at 50% 10%, rgba(255,255,255,.25), transparent 55%),
            linear-gradient(180deg, #bfc6ca 0%, #8f969a 45%, #6f767a 100%);
        }
        .hero-overlay{position:absolute; inset:0; background:
          radial-gradient(1200px 420px at 50% 8%, rgba(0,0,0,0.3), transparent 60%),
          linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.15));}
        .hero-content{position:relative; text-align:center; color:#fff; padding:36px; transform:translateY(10px); opacity:0; transition:400ms ease;}
        .hero.in .hero-content{transform:none; opacity:1;}
        .hero-title{font-size:clamp(2.6rem,6vw,4.4rem); margin:.2rem 0;}
        .hero-strap{opacity:.95; font-size:clamp(1.1rem,2.4vw,1.35rem)}
        .hero-cta{display:flex; gap:16px; justify-content:center; margin-top:18px; flex-wrap:wrap}

        /* LAYOUT */
        .container{width:100%; max-width:none; margin:0 auto; padding:48px clamp(16px,4vw,40px)}
        .header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:24px 0}
        .brand{display:flex;align-items:center;gap:14px}
        .logo{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;
              background:linear-gradient(135deg,#35c68a,#28a06d); color:#fff; font-weight:900; font-size:22px;
              box-shadow:0 8px 20px rgba(40,160,109,.35);}
        h2{margin:0;font-size:clamp(1.6rem,3vw,2.2rem)}
        .kicker{color:var(--primary);font-weight:800;letter-spacing:.02em}
        .header-actions{display:flex; gap:12px}

        .stack{display:flex; flex-direction:column; gap:56px;}
        .card{width:100%; background:var(--card); border-radius:24px; padding:36px clamp(16px,3vw,40px); box-shadow:0 12px 32px rgba(0,0,0,.08);}
        .card > * + *{ margin-top:16px; }
        .card p, .card li{ max-width: var(--measure); }
        .cta{display:flex; gap:14px; flex-wrap:wrap; justify-content:center; margin-top:14px}
        ul{margin:0;padding-left:26px}
        li{margin:12px 0}
        .pill{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(40,160,109,.25); color:var(--primary); padding:8px 12px;border-radius:999px;font-weight:600;background:rgba(40,160,109,.06)}
        .badge{display:inline-block;background:rgba(14,165,233,.12);color:var(--accent);padding:6px 12px;border-radius:999px;font-size:1rem;font-weight:700}
        .phase{border:1px dashed rgba(31,42,36,.15);border-radius:16px;padding:18px;margin-top:10px}

        /* TIP readability fix (dark mode) */
        .tip-box{
          margin-top:10px;border-radius:14px;padding:18px;background:#fff;border:1px solid rgba(0,0,0,.08);
          color:#1f2a24; /* dark ink on white for contrast */
        }
        .theme.dark .tip-box{
          background:#fff; color:#1f2a24; border-color:rgba(0,0,0,.18);
        }

        .link{color:#0ea5e9;text-decoration:none;border-bottom:1px solid transparent}
        .link:hover{border-bottom-color:currentColor}

        .btn{border:0;border-radius:999px;padding:12px 18px;cursor:pointer;font-weight:700;background:var(--primary);color:#fff;transition:transform .15s ease, opacity .15s}
        .btn:hover{transform:translateY(-1px)}
        .btn:active{transform:translateY(0)}
        .btn.secondary{background:#111}
        .btn.accent{background:var(--accent)}
        .btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.65);color:#fff}
        .btn:focus-visible{outline:3px solid var(--ring);outline-offset:2px}

        footer{margin:44px 0 8px;color:var(--muted);text-align:center;font-size:1rem}

        .modal{position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.4); backdrop-filter: blur(2px); z-index:50}
        .modal-card{background:var(--card); color:inherit; width:min(560px, 92vw); border-radius:22px; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,.3)}
        .modal-card h3{margin:0 0 14px}

        .reveal{opacity:0; transform:translateY(10px); transition:400ms ease}
        .reveal.in{opacity:1; transform:none}
        @media (prefers-reduced-motion: reduce){
          .reveal, .btn, .hero-content{transition:none}
        }
      `}</style>
    </main>
  );
}

/* ---------- Reveal wrapper ---------- */
function Reveal({ children }) {
  const [ref, inView] = useInView(0.15);
  return <div ref={ref} className={`reveal ${inView ? 'in' : ''}`}>{children}</div>;
}

/* ---------- Profile Form ---------- */
function ProfileForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [focus, setFocus] = useState(initial?.focus ?? 'lose');
  const [diet, setDiet] = useState(initial?.diet ?? 'omnivore');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ name, focus, diet }); }}>
      <label>Name</label>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width:'100%', padding:12, borderRadius:12, border:'1px solid rgba(0,0,0,.12)', background:'var(--bg)', color:'inherit' }}
      />
      <div className="row two" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
        <div>
          <label>Focus</label>
          <select value={focus} onChange={(e) => setFocus(e.target.value)}
            style={{ width:'100%', padding:12, borderRadius:12, border:'1px solid rgba(0,0,0,.12)', background:'var(--bg)', color:'inherit' }}>
            <option value="lose">Lose</option>
            <option value="refuel">Refuel</option>
          </select>
        </div>
        <div>
          <label>Diet</label>
          <select value={diet} onChange={(e) => setDiet(e.target.value)}
            style={{ width:'100%', padding:12, borderRadius:12, border:'1px solid rgba(0,0,0,.12)', background:'var(--bg)', color:'inherit' }}>
            <option value="omnivore">Omnivore</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>
      </div>
      <div className="modal-actions" style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:14 }}>
        <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn accent">Save</button>
      </div>
    </form>
  );
}
