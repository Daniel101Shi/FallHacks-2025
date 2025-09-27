'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Navbar from '../../components/Navbar'; // Make sure to import your new Navbar

const data = {
  brand: 'Refuel',
  headline: 'Help & Support',
  strap: 'Questions? We’ve got answers.',
  faq: [
    {
      q: 'How do I personalize Refuel?',
      a: 'Click the ⚙️ button on the top right or "Personalize" in the hero section to set your profile.'
    },
    {
      q: 'Can I track my calories and progress?',
      a: 'Yes! Use the TDEE & Refuel Planner section to input your info and see your targets.'
    },
    {
      q: 'What if I have dietary restrictions?',
      a: 'We provide tips based on your diet (vegetarian/vegan/omnivore) when you set your profile.'
    },
    {
      q: 'How can I contact real humans?',
      a: 'Email us at hello@tryrefuel.example and we’ll respond as quickly as possible.'
    }
  ],
  tips: [
    'Check the Planner section for weekly guidance.',
    'Use the Refuel Tip button for quick ideas.',
    'Update your profile regularly for personalized recommendations.'
  ],
};

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

export default function HelpPage() {
  const [dark, setDark] = useState(false);
  useEffect(() => { if (ls.get('refuel.dark') === '1') setDark(true); }, []);
  useEffect(() => { ls.set('refuel.dark', dark ? '1' : '0'); }, [dark]);

  const [heroRef, heroIn] = useInView(0.1);

  const [tip, setTip] = useState('Click "Refuel Tip" for a quick help tip.');
  const pickTip = () => setTip(data.tips[Math.floor(Math.random() * data.tips.length)]);

  return (
    <main className={`theme ${dark ? 'dark' : ''}`}>
      <Navbar />

      {/* HERO */}
      <section ref={heroRef} className={`hero ${heroIn ? 'in' : ''}`}>
        <div className="hero-media">
          <img className="hero-poster" src="/images/refuel-hero.jpg" alt="Refuel help hero" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <span className="badge" aria-hidden="true">Need Help?</span>
          <h1 className="hero-title">{data.brand}</h1>
          <p className="hero-strap">{data.strap}</p>
          <div className="hero-cta">
            <button className="btn accent" onClick={pickTip}>Refuel Tip</button>
          </div>
          <div className="tip-box">{tip}</div>
        </div>
      </section>

      <div className="container reveal in">
        <header className="header">
          <h2 id="page-title">{data.headline}</h2>
          <button className="btn secondary" aria-pressed={dark ? 'true' : 'false'} onClick={() => setDark(d => !d)}>🌙</button>
        </header>

        <section className="stack" role="region" aria-labelledby="page-title">
          {data.faq.map(({ q, a }) => (
            <Reveal key={q}>
              <article className="card">
                <h3>{q}</h3>
                <p>{a}</p>
              </article>
            </Reveal>
          ))}
        </section>

        <footer>© {new Date().getFullYear()} {data.brand}. All rights reserved.</footer>
      </div>

      <style jsx>{`
        .theme{--bg:#f7fbf8;--fg:#1f2a24;--muted:#6a746f;--primary:#28a06d;--accent:#0ea5e9;--card:#fff;--ring:rgba(40,160,109,.28);background:var(--bg);color:var(--fg);font-size:18px;line-height:1.9}
        .theme.dark{--bg:#0c1210;--fg:#e8f1ee;--muted:#9fb0a9;--card:#0f1614;--ring:rgba(53,198,138,.35);}
        .hero{position:relative; min-height:50vh; display:grid; place-items:center; overflow:hidden;}
        .hero-media{position:absolute; inset:0;}
        .hero-poster{position:absolute;width:100%;height:100%;object-fit:cover;}
        .hero-overlay{position:absolute;inset:0;background:radial-gradient(1200px 420px at 50% 8%, rgba(0,0,0,0.3), transparent 60%),linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.15));}
        .hero-content{position:relative;text-align:center;color:#fff;padding:36px;transform:translateY(10px);opacity:0;transition:400ms ease;}
        .hero.in .hero-content{transform:none;opacity:1;}
        .hero-title{font-size:clamp(2.6rem,6vw,4.4rem);margin:.2rem 0;}
        .hero-strap{opacity:.95;font-size:clamp(1.1rem,2.4vw,1.35rem);}
        .hero-cta{margin-top:18px;}
        .container{width:100%; max-width:none; margin:0 auto; padding:48px clamp(16px,4vw,40px);}
        .header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:24px 0}
        .stack{display:flex; flex-direction:column; gap:32px;}
        .card{background:var(--card); border-radius:24px; padding:36px; box-shadow:0 12px 32px rgba(0,0,0,.08);}
        .tip-box{margin-top:10px;border-radius:14px;padding:18px;background:#fff;border:1px solid rgba(0,0,0,.08);color:#000;}
        .btn{border:0;border-radius:999px;padding:12px 18px;cursor:pointer;font-weight:700;background:var(--primary);color:#fff;transition:transform .15s ease,opacity .15s;}
        .btn.accent{background:var(--accent);}
        footer{margin:44px 0 8px;color:var(--muted);text-align:center;font-size:1rem;}
        .reveal{opacity:0;transform:translateY(10px);transition:400ms ease;}
        .reveal.in{opacity:1;transform:none;}
      `}</style>
    </main>
  );
}

function Reveal({ children }) {
  const [ref, inView] = useInView(0.15);
  return <div ref={ref} className={`reveal ${inView ? 'in' : ''}`}>{children}</div>;
}
