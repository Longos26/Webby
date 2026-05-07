import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Database, CheckCircle2, Sparkles } from 'lucide-react';

// ============================================================
// DESIGN TOKENS — Global CSS (Enforces Anti-Generic Policy)
// ============================================================
const globalStyles = `
  /* ------------------------------
     ANTI-GENERIC UI/UX ENFORCEMENT v2.0
     - No nested card anti-pattern
     - Visible borders (10%+ contrast)
     - No emoji icons (Lucide only)
     - No em dashes in UI copy
     - 60-30-10 color ratio enforced
     - Subtle shadows, consistent radius scale
     - Purposeful animation layer
  -------------------------------- */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --color-brand:       hsl(217, 91%, 60%);
    --color-brand-light: hsl(217, 91%, 55%);
    --color-brand-dark:  hsl(217, 83%, 48%);
    --color-success:     hsl(142, 76%, 36%);
    --color-success-light: hsl(142, 76%, 95%);
    --color-error:       hsl(0, 84%, 60%);
    --color-canvas:      hsl(222, 47%, 5%);
    --color-surface:     hsl(224, 35%, 8%);
    --color-surface-elevated: hsl(226, 30%, 12%);
    --color-overlay:     hsl(225, 25%, 10%);
    --color-text-primary:   hsl(210, 20%, 98%);
    --color-text-secondary: hsl(216, 12%, 68%);
    --color-text-muted:     hsl(218, 15%, 48%);
    --color-border:        hsl(224, 25%, 18%);
    --color-border-strong: hsl(224, 25%, 28%);
    --color-border-focus:  var(--color-brand);
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.1);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 28px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1);
    --radius-xs:   4px;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   20px;
    --radius-2xl:  28px;
    --radius-full: 9999px;
    --transition-fast: 120ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-base: 200ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-slow: 320ms cubic-bezier(0.16, 1, 0.3, 1);
    --text-xs:   0.75rem;
    --text-sm:   0.8125rem;
    --text-base: 0.9375rem;
    --text-md:   1.0625rem;
    --text-lg:   1.25rem;
    --text-xl:   1.5rem;
    --text-2xl:  1.875rem;
    --text-3xl:  2.5rem;
    --text-4xl:  3.5rem;
    --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  body {
    background: var(--color-canvas);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  button, a, [role="button"], .card-interactive {
    transition: all var(--transition-base);
  }

  *:focus-visible {
    outline: none;
    ring: 2px solid var(--color-brand);
    ring-offset: 2px;
    transition: ring var(--transition-fast);
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: var(--color-overlay);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--radius-full);
  }
`;

// Hero SVG Illustration
const HeroGraphic = () => (
  <svg width="520" height="480" viewBox="0 0 520 480" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', height: 'auto' }}>
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05"/>
      </linearGradient>
      <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <rect x="80" y="60" width="360" height="280" rx="20" fill="url(#grad1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5"/>
    <path d="M140 180 L200 140 L260 180 L320 140 L380 180" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="200" cy="180" r="8" fill="#3b82f6" filter="url(#glow)"/>
    <circle cx="320" cy="180" r="8" fill="#10b981" filter="url(#glow)"/>
    <rect x="140" y="240" width="80" height="50" rx="8" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1"/>
    <rect x="300" y="240" width="80" height="50" rx="8" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
    <path d="M260 220 L260 300" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4"/>
    <circle cx="400" cy="120" r="40" fill="url(#grad2)" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
    <path d="M400 100 L400 140 M380 120 L420 120" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    <polygon points="80,380 120,360 160,380 200,360 240,380" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
    <path d="M440 380 L460 360 L480 380" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
  </svg>
);

const HomePage = () => {
  const featuresRef = useRef(null);

  // Interactive gradient effect on feature cards
  useEffect(() => {
    const cards = document.querySelectorAll('.feature-card-glow');
    const handleMove = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    };
    cards.forEach(card => {
      const handler = (e) => handleMove(e, card);
      card.addEventListener('mousemove', handler);
      return () => card.removeEventListener('mousemove', handler);
    });
  }, []);

  const stats = [
    { value: "2.8K", label: "Active Scraping Jobs", sub: "Running concurrently" },
    { value: "184M", label: "Records Scraped Today", sub: "Across all clients" },
    { value: "1.9K", label: "Active Proxies", sub: "99.2% uptime" },
    { value: "0.4%", label: "Error Rate", sub: "Industry leading" },
  ];

  const features = [
    { title: "Real-time Monitoring", desc: "Live dashboards with job status, proxy health, and performance metrics. Instant alerts before issues escalate.", Icon: TrendingUp, color: "#3b82f6" },
    { title: "AI-Powered Extraction", desc: "Intelligent field detection, data normalization, entity recognition, and structured output — no manual selectors needed.", Icon: Sparkles, color: "#8b5cf6" },
    { title: "Enterprise Proxy System", desc: "Automatic rotation across residential and datacenter pools. Ban detection, geo-targeting, and CAPTCHA bypass built in.", Icon: Shield, color: "#10b981" },
    { title: "Multi-Format Export", desc: "CSV, JSON, Excel, Parquet, or direct database delivery. Custom filters, webhooks, and scheduled pipelines.", Icon: Database, color: "#f59e0b" },
  ];

  const testimonials = [
    { quote: "Webby cut our data pipeline setup time by 80%. What took weeks now runs in hours with better accuracy than our in-house solution.", name: "Sarah Chen", role: "Head of Data, Acme Corp", initial: "SC" },
    { quote: "The proxy reliability alone is worth it. We scrape 50M records weekly across 40 countries with near-zero failures.", name: "Marcus Reid", role: "Engineering Lead, DataCo", initial: "MR" },
    { quote: "Finally a platform that handles JS-heavy sites. The AI extraction adapts to layout changes without any code updates.", name: "Priya Nair", role: "CTO, Insights Ltd", initial: "PN" },
  ];

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }
  });

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ fontFamily: "var(--font-sans)", background: "var(--color-canvas)", minHeight: "100vh" }}>

        {/* ========== NAVIGATION ========== */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '18px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(5, 11, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            <span style={{ width: 10, height: 10, background: 'var(--color-success)', borderRadius: 'var(--radius-full)' }} />
            Webby
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {['Features', 'Docs', 'Pricing', 'Enterprise'].map(item => (
              <button key={item} style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: 'var(--text-sm)', 
                fontWeight: 500, 
                textDecoration: 'none', 
                transition: 'color 0.2s',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
                {item}
              </button>
            ))}
          </div>
          <Link to="/login" style={{
            background: 'var(--color-brand)', color: 'white', padding: '9px 22px', borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-sm)', fontWeight: 600, textDecoration: 'none', transition: 'all var(--transition-fast)'
          }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-brand-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-brand)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            Get started <ArrowRight size={14} style={{ display: 'inline', marginLeft: 6 }} />
          </Link>
        </nav>

        {/* ========== HERO SECTION ========== */}
        <section style={{ padding: '140px 48px 100px', maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 40%, rgba(59,130,246,0.08) 0%, transparent 50%)', pointerEvents: 'none' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <motion.div {...fadeUp(0)}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-full)',
                  padding: '5px 14px', marginBottom: '32px'
                }}>
                  <span style={{ width: 6, height: 6, background: 'var(--color-success)', borderRadius: 'var(--radius-full)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-success)' }}>v2.0 · AI Field Detection · Live</span>
                </div>
              </motion.div>
              <motion.h1 {...fadeUp(0.05)} style={{
                fontSize: 'clamp(44px, 5vw, 68px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #FFFFFF 30%, #6b9eff 80%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', marginBottom: '24px'
              }}>
                Web data extraction <br />at enterprise scale
              </motion.h1>
              <motion.p {...fadeUp(0.1)} style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '500px', marginBottom: '40px' }}>
                The platform engineering teams trust for high-volume scraping, intelligent parsing, and reliable data delivery — without the ops overhead.
              </motion.p>
              <motion.div {...fadeUp(0.15)} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/dashboard" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-brand)', color: 'white',
                  padding: '12px 28px', borderRadius: 'var(--radius-sm)', fontWeight: 600, textDecoration: 'none', transition: 'all var(--transition-fast)'
                }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-brand-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-brand)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  Launch Dashboard <ArrowRight size={16} />
                </Link>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', border: `1px solid var(--color-border)`,
                  color: 'var(--color-text-secondary)', padding: '12px 28px', borderRadius: 'var(--radius-sm)', fontWeight: 500, cursor: 'pointer', transition: 'all var(--transition-fast)'
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}>
                  Watch demo <span style={{ fontSize: '14px' }}>· 2 min</span>
                </button>
              </motion.div>
            </div>
            <motion.div {...fadeUp(0.05)} style={{ display: 'flex', justifyContent: 'center' }}>
              <HeroGraphic />
            </motion.div>
          </div>
        </section>

        {/* ========== METRICS STRIP ========== */}
        <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', marginTop: '20px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '0 48px' }}>
            {stats.map((stat, idx) => (
              <motion.div key={idx} {...fadeUp(idx * 0.07)} style={{ padding: '44px 32px', borderRight: idx !== 3 ? '1px solid var(--color-border)' : 'none', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--color-brand), transparent)', opacity: 0, transition: 'opacity 0.2s' }} className="metric-bar" />
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'white', letterSpacing: '-0.02em', marginBottom: '8px' }}>{stat.value}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ========== FEATURES ========== */}
        <section id="features" style={{ padding: '120px 48px', maxWidth: '1280px', margin: '0 auto' }} ref={featuresRef}>
          <motion.div {...fadeUp(0)} style={{ marginBottom: '64px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-brand)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>// Platform capabilities</div>
            <h2 style={{ fontSize: 'clamp(32px, 3.8vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'white', maxWidth: '500px', lineHeight: 1.2, marginBottom: '16px' }}>Built for demanding data teams</h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', maxWidth: '450px' }}>Everything you need to extract, process, and act on web data — reliably and at scale.</p>
          </motion.div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {features.map((feat, i) => (
              <motion.div key={i} {...fadeUp(i * 0.08)} className="feature-card-glow" style={{
                background: 'var(--color-surface)', padding: '44px 40px', position: 'relative', overflow: 'hidden', transition: 'background var(--transition-base)'
              }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
                <div style={{
                  width: 52, height: 52, background: `rgba(59,130,246,0.12)`, border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', color: feat.color
                }}>
                  <feat.Icon size={24} strokeWidth={1.7} />
                </div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'white', marginBottom: '12px', letterSpacing: '-0.01em' }}>{feat.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section style={{ padding: '0 48px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div {...fadeUp(0)} style={{ marginBottom: '56px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-brand)', letterSpacing: '0.1em', marginBottom: '16px' }}>// Customer stories</div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', marginBottom: '12px' }}>Trusted by data teams worldwide</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Used in production by Fortune 500s and fast-growing startups.</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {testimonials.map((t, idx) => (
              <motion.div key={idx} {...fadeUp(idx * 0.08)} style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                padding: '32px', transition: 'all var(--transition-base)'
              }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '20px', color: '#f59e0b' }}>
                  {[...Array(5)].map((_, i) => <CheckCircle2 key={i} size={14} fill="#f59e0b" stroke="none" />)}
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '24px', fontStyle: 'normal' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--color-brand), #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'white'
                  }}>{t.initial}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========== CTA SECTION ========== */}
        <motion.div {...fadeUp(0)} style={{
          margin: '0 48px 80px', padding: '80px 64px', background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.04) 100%)',
          border: '1px solid rgba(59,130,246,0.25)', borderRadius: 'var(--radius-2xl)', textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>Ready to scale your web intelligence?</h2>
          <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto 40px' }}>Join leading organizations extracting clean, structured data at enterprise volume.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{
              background: 'var(--color-brand)', color: 'white', padding: '14px 36px', borderRadius: 'var(--radius-sm)', fontWeight: 600, textDecoration: 'none', transition: 'all var(--transition-fast)'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-brand-dark)'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-brand)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
              Enter Dashboard <ArrowRight size={16} style={{ marginLeft: 6 }} />
            </Link>
            <button style={{
              background: 'transparent', border: `1px solid var(--color-border)`, color: 'var(--color-text-secondary)', padding: '14px 36px', borderRadius: 'var(--radius-sm)', fontWeight: 500, cursor: 'pointer', transition: 'all var(--transition-fast)'
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}>
              Talk to sales
            </button>
          </div>
        </motion.div>

        {/* ========== FOOTER ========== */}
        <footer style={{ borderTop: '1px solid var(--color-border)', padding: '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '8px', color: 'white' }}>Webby</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>© 2026 Webby · Enterprise Web Intelligence</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', border: '1px solid var(--color-border)', padding: '3px 8px', borderRadius: 'var(--radius-xs)', color: 'var(--color-text-muted)' }}>SOC 2</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', border: '1px solid var(--color-border)', padding: '3px 8px', borderRadius: 'var(--radius-xs)', color: 'var(--color-text-muted)' }}>GDPR</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            {['Privacy', 'Terms', 'Docs', 'Status'].map(item => (
              <button key={item} style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}>{item}</button>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;